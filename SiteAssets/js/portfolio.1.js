"use strict";

// loader settings
var opts = {
    lines: 9, // The number of lines to draw
    length: 9, // The length of each line
    width: 5, // The line thickness
    radius: 14, // The radius of the inner circle
    color: '#c10e19', // #rgb or #rrggbb or array of colors
    speed: 1.9, // Rounds per second
    trail: 40, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};

var target = document.getElementById("dashboard");

// trigger loader
var spinner = new Spinner(opts).spin(target);

// dimensions for the charts
var margins = {
    top: 25,
    right: 10,
    bottom: 40,
    left: 10
};

// var size = getSize();
// var height = size.height;
// var width = size.width;

var dashboardHeight = getSize().height;
var headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
var footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

var bubbleChartHeaderHeight = document.querySelector('#bubbleChart header').offsetHeight;
var bubbleChartFooterHeight = document.querySelector('#bubbleChart footer').offsetHeight;
var bubbleChartHeight = (dashboardHeight - headerHeight - footerHeight - bubbleChartHeaderHeight - bubbleChartFooterHeight) * 1/3;
var bubbleChartWidth = document.querySelector('#bubbleChart footer').clientWidth; // does not include margin, padding, or scroll bar widths

var tableHeaderHeight = document.querySelector('#tableChart header').offsetHeight;
var tableFooterHeight = document.querySelector('#tableChart footer').offsetHeight;
var tableHeight = (dashboardHeight - headerHeight - footerHeight - tableHeaderHeight - tableFooterHeight) * 1/3 * 0.85;

var tableWidth = document.querySelector('#tableChart footer').clientWidth; // does not include margin, padding, or scroll bar widths

// tick label and tooltip formats
var sFormat = d3.format("s"),
    dFormat = d3.format("d"),
    iFormat = d3.format(",.0f"),
    perFormat = d3.format(".1%"),
    currFormat = d3.format("$,.0f");

// local formatting to get billions
// https://github.com/d3/d3/issues/2241
var formatNumber = d3.format(".1f"),
    formatBillion = function(x) {
        return '$' + formatNumber(x / 1e9) + "B";
    },
    formatMillion = function(x) {
        return '$' + formatNumber(x / 1e6) + "M";
    },
    formatThousand = function(x) {
        return '$' + formatNumber(x / 1e3) + "k";
    };

// tooptip
var tooltip = d3.select("body")
    .append("div")
    .style({
        "position": "absolute",
        "z-index": "10",
        "visibility": "hidden"
    })
    .attr({
        "class": "tooltip"
    });

// dc.js chart types
var yearSelect = dc.selectMenu('#years');
var componentSelect = dc.selectMenu('#components');
// var compositionbubbleChart = dc.bubbleChart('#component');
var compositionTreemapChart = dc.treemapChart('#component');
var dataTable = dc.dataTable('#data-table');

// http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
function getSize() {
    var myWidth = 0,
        myHeight = 0;
    if (typeof(window.innerWidth) == 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    }
    else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    }
    else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return {
        "height": myHeight,
        "width": myWidth
    };
}

function formatAbbreviation(x) {
    var v = Math.abs(x);
    return (v >= 0.9995e9 ? formatBillion :
        v >= 0.9995e6 ? formatMillion :
        formatThousand)(x);
}

function createViz(error, componentsData) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    var years = [];

    var data = componentsData.value.filter(function(d) {
        d.Total = +d.Total * 1000;
        d.DME = +d.DME * 1000;
        d.SS = +d.SS * 1000;
        d.PercentChange = +d.PercentChange || 0;
        d.PercentageDME = +d.PercentageDME || 0;
        d.PercentageSS = +d.PercentageSS || 0;
        d.Year = +d.Year;
        if (years.indexOf(d.Year) < 0 && d.Year > 2013) {
            years.push(d.Year);
        }
        return d.InvestmentName !== null && d.Year > 2013 && d.Total !== 0;
    });

    years.sort();

    // set crossfilter
    var ndx = crossfilter(data);

    // define dimensions
    var
        componentDim = ndx.dimension(function(d) {
            return d.Component;
        }),
        timeDim = ndx.dimension(function(d) {
            return d.Year;
        }),
        component2Dim = ndx.dimension(function(d) {
            return d.Component;
        }),
        idDim = ndx.dimension(function(d) {
            return d.Component;
        });

    // group dimensions
    var
        all = ndx.groupAll(),
        amountByYear = timeDim.group().reduceSum(function(d) {
            return Math.round(d.Total);
        }),
        selectByComponent = component2Dim.group().reduceSum(function(d) {
            return Math.round(d.Total);
        }),
        amountByComponent = componentDim.group().reduceSum(function(d) {
            return Math.round(d.Total);
        }),
        // amountByComponent = componentDim.group().reduce(
        //     function(p, v) {
        //         ++p.count;
        //         p.amount += Math.round(v.Total);
        //         return p;
        //     },
        //     function(p, v) {
        //         --p.count;
        //         p.amount -= Math.round(v.Total);
        //         return p;
        //     },
        //     function() {
        //         return {
        //             count: 0,
        //             amount: 0
        //         };
        //     }
        // ),
        totalAmount = ndx.groupAll().reduceSum(function(d) {
            return Math.round(d.Total);
        });

    var maxAmount = d3.max(amountByYear.top(Infinity),function(d) {
        return d.value;
    });
    
    // fiscal year menuselect
    yearSelect
        .dimension(timeDim)
        .group(amountByYear)
        // .filterDisplayed(function () {
        //     return true;
        // })
        .multiple(false)
        .numberVisible(null)
        // .order(function (a,b) {
        //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
        // })
        .title(function(d) {
            return d.key;
        })
        // .promptText('2017')
        .promptValue(2017);

    yearSelect.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#years').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });
    
    yearSelect.filter(2017);

    // fiscal year menuselect
    componentSelect
        .dimension(component2Dim)
        .group(selectByComponent)
        // .filterDisplayed(function () {
        //     return true;
        // })
        .multiple(true)
        .numberVisible(null)
        // .order(function (a,b) {
        //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
        // })
        .title(function(d) {
            return d.key;
        })
        .promptText('All Components')
        .promptValue(null);

    componentSelect.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#components').classed('dc-chart', false);
        // chart.select('select').classed('w3-form', true);
        var select = chart.select('select')
        select
            .classed('form-control', true)
            .attr('multiple','multiple');
        var firstChild = chart.select('select').node().firstElementChild;
        if (!firstChild.value) {
            d3.select(chart.select('select').node().firstElementChild).remove();
        }
        $('#components>select').multiselect();
    });
    
    // displays
    dc.numberDisplay("#total-spend")
        .formatNumber(dFormat)
        .valueAccessor(function(d) {
            return d;
        })
        .group(totalAmount)
        .formatNumber(function(d) {
            return formatAbbreviation(Math.abs(d));
        });

    dc.dataCount('#data-count')
        .dimension(ndx)
        .group(all);

    // charts
    // compositionbubbleChart
    //     .width(bubbleChartWidth)
    //     .height(bubbleChartHeight)
    //     .dimension(componentDim)
    //     .group(amountByComponent)
    //     .ordinalColors(colorbrewer.Paired[9])
    //     .keyAccessor(function(d) {
    //         return d.value.amount;
    //     })
    //     .valueAccessor(function(d) {
    //         return d.value.count;
    //     })

    //     .radiusValueAccessor(function (p) {
    //         return p.value.count;
    //     })
    //     .y(d3.scale.linear().domain([0,100]))
    //     .x(d3.scale.linear().domain([0,1500000000]))
    //     .r(d3.scale.linear().domain([0,100]))
    //     .minRadiusWithLabel(12)
    //     .yAxisPadding(100)
    //     .elasticX(false)
    //     .elasticRadius(false)
    //     .sortBubbleSize(true)
    //     .xAxisPadding(200)
    //     .maxBubbleRelativeSize(0.07)
    //     .renderHorizontalGridLines(true)
    //     .renderVerticalGridLines(true)
    //     .margins({
    //         top: margins.top,
    //         right: margins.right,
    //         bottom: margins.bottom,
    //         left: margins.left + 50
    //     })
    //     .renderLabel(true)
    //     .renderTitle(false  )
    //     .elasticY(false);
        
    //     compositionbubbleChart
    //     .yAxisLabel("Number of Investments per Component")
    //     .yAxis().ticks(Math.max(bubbleChartWidth / 100, 2)).tickFormat(function(d) {
    //         return d;
    //     });
    //     compositionbubbleChart
    //     .xAxisLabel("Total IT Spend")
    //     .xAxis().ticks(Math.max(bubbleChartWidth / 100, 2)).tickFormat(function(d) {
    //         return formatAbbreviation(d);
    //     })
    //     ;

    // compositionbubbleChart.on('pretransition', function(chart) {
    //     var circles = d3.selectAll('circle');
    //     circles.style('stroke-width','2px'); // make circle stroke bigger
    //     circles.style('stroke',function(d) { return d3.rgb(d3.select(this).style('fill')).darker(1);} ); // add darker stroke to each circle
    //     setResponsiveSVG(chart);
    // });

    compositionTreemapChart
        .width(bubbleChartWidth)
        .height(bubbleChartHeight)
        .dimension(componentDim)
        .group(amountByComponent)
        .ordinalColors(colorbrewer.Set3[9])
        .keyAccessor(function(d) {
            return d.key;
        })
        .valueAccessor(function(d) {
            return d.value;
        })
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left + 50
        })
        .renderTitle(false)
        ;

    compositionTreemapChart.on('pretransition', function(chart) {
        chart.selectAll('div.node').style('border-color','white');
    });
    
    dataTable
        .width(tableWidth)
        .height(tableHeight)
        .dimension(idDim)
        .group(function (d) {
            return d.Id;
        })
        .columns([
            {
                label: 'UII',
                format: function(d) { return d.UII; }
            },
            {
                label: 'Year',
                format: function(d) { return d.Year; }
            },
            {
                label: 'Component',
                format: function(d) { return d.Component; }
            },
            {
                label: 'Investment Name',
                format: function(d) { return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + d.InvestmentName + "</a>"; }
            },
            {
                label: 'Total',
                format: function(d) { return formatAbbreviation(d.Total); }
            }
            ])
        .sortBy(function (d) { return d.Component; })
        .size(Infinity)
        .order(d3.ascending)
        .on('renderlet',function (table) {
            table.selectAll(".dc-table-group").remove(); // remove dc.js default first row
        });        

    dc.renderAll();

    // define mouseover and mouseout events
    function bindHover() {
        // d3.selectAll('g.node').on("mouseover", function(d) {
        //     var key = d.key;
        //     var amount = currFormat(d.value.amount);
        //     var count = d.value.count;
        //     showDetail(key, amount, count, null)
        // }).on("mouseout", hideDetail);
        d3.selectAll('div.node').on("mouseover", function(d) {
            var key = d.key;
            var amount = currFormat(d.value);
            // var count = currFormat(d.value.count);
            showDetail(key, amount, null, null)
        }).on("mouseout", hideDetail);
    }

    bindHover();
    
    // Change the date header to reflect the date and time of the data
    d3.select('#dateHeader').text(moment().format('LLL'));

    // define reset mouseover event
    d3.selectAll('.reset').on('mouseover', function(e) {
        $(this).css('cursor', 'pointer');
    });
    
    // define table column sort
    d3.selectAll('#data-table th').on('click',function() {
    //   console.log(d3.select(this));
        // http://bl.ocks.org/AMDS/4a61497182b8fcb05906
        var rows = d3.select(this.closest('table')).select('tbody').selectAll('tr');
        var data = d3.select(this.closest('table').children[1]).data()[0].values;
        debugger;
        // console.log(data);
        var sortAscending = true;
        if (sortAscending) {
            rows.sort(function(a, b) { 
                return a.Component - b.Component;
            });
            sortAscending = false;
            this.className = 'aes';
        } else {
            rows.sort(function(a, b) { 
                return b.Component - a.Component;
            });
            sortAscending = true;
            this.className = 'des';
        }
    });
    
    // define multichoice change event
    d3.selectAll('li:not(.multiselect-group) input').on('change',function(e) {
        var components = [];
        d3.selectAll('li.dc-select-option input')[0].forEach(function(g) {
            var checked = false;    
            var name = g.value;
            checked = d3.select(g).property('checked');
            
            if ((checked && !componentSelect.hasFilter(name)) || (!checked && componentSelect.hasFilter(name))) {
                components.push(name);
            }
        });
            
        if (!components.length > 0) {
            componentSelect.filterAll();
        } else {
            componentSelect.filter([components]);
        }
        
        dc.redrawAll();
    });

    // define reset click events
    // d3.select('#bubbleChartReset').on('click', function() {
    //     compositionbubbleChart.filterAll();
    //     dc.redrawAll();
    // });

    // add selected item information as table in modal
    $('#data-table').on('click', 'tbody tr a', function(event) {
        var thisTable = d3.select($(this).closest('table')[0]);
        var thisRow = d3.select($(this).closest('tr')[0]);
        var cells = thisRow.selectAll('td')[0].map(function(d) {
            var text;
            if (d.firstChild !== undefined && d.firstChild.textContent !== undefined) {
                text = d.firstChild.textContent;
            }
            else {
                text = d.textContent;
            }
            return text;
        });
        var headers = thisTable.selectAll('thead th')[0].map(function(d) {
            return d.textContent;
        });
        var data = headers.map(function(d, i) {
            var obj = {};
            obj.key = d;
            obj.value = cells[i];
            return obj;
        });

        $('#tableDiv table').remove();
        var table = d3.select('#tableDiv').append('table').attr({
            'id': 'modal-table',
            'class': 'table table-bordered table-condensed'
        }).style({
            'width': '100%',
            'table-layout': 'fixed'
        });
        var tbody = table.append('tbody');

        var rows = tbody.selectAll('tr')
            .data(data);

        rows.enter()
            .append('tr');

        rows.exit().remove();

        rows.append('td').text(function(d) {
            return d.key;
        });
        rows.append('td').text(function(d) {
            return d.value;
        });
    });

    // Many browsers -- IEparticularly -- will not auto-size inline SVG
    // IE applies default width and height sizing
    // padding-bottom hack on a container solves IE inconsistencies in size
    // https://css-tricks.com/scale-svg/#article-header-id-10
    function setResponsiveSVG(chart) {
        var width = +chart.select('svg').attr('width');
        var height = +chart.select('svg').attr('height');
        var calcString = +(height / width) * 100 + "%";

        var svgElement = chart.select('svg');
        var svgParent = d3.select(chart.select('svg').node().parentNode);
        
        svgElement.attr({
            'class':'scaling-svg',
            'preserveAspectRatio':'xMinYMin',
            'viewBox':'0 0 ' + width + ' ' + height,
            'width':null,
            'height':null
        });
        
        svgParent.style('padding-bottom',calcString);
    }

    // https://www.safaribooksonline.com/blog/2014/02/17/building-responsible-visualizations-d3-js/
    // var resizeCharts = debounce(function() {
        //   var newbubbleChartWidth = document.querySelector('#bubbleChart footer').clientWidth;
        // //   var legendOffset = newbubbleChartWidth * 1/12;
        //   compositionbubbleChart
        //     .width(newbubbleChartWidth)
        //     // .legend(dc.legend().x(newbubbleChartWidth - legendOffset))
        //     .transitionDuration(0);

        //   var newRowChartWidth = document.querySelector('#rowChart footer').clientWidth;
        //   topTen
        //     .width(newRowChartWidth)
        //     .transitionDuration(0)
        //     .xAxis().ticks(Math.max(newRowChartWidth/50, 2));

        //   dc.renderAll();
        //   topTen.transitionDuration(750);
        //   compositionbubbleChart.transitionDuration(750);

        // rebind hover events on charts
    //     bindHover();
    // }, 25);

    // window.addEventListener('resize', resizeCharts);

}

// if this JavaScript source file resides on a SharePoint server
// the function will return an endpoint Url pointing to a specified SharePoint list
// if not, the endpoint will point to a json file
function getData() {

    var test = '';
    var siteUrl = '';
    var columns = '';
    var expand = '';
    var filter = '';
    var top = '';
    var instrg = 0;

        // test if on SharePoint
        try {
            instrg = _spPageContextInfo.webAbsoluteUrl.indexOf('itim');
            if (typeof _spPageContextInfo !== undefined &&  instrg > 0) {
                siteUrl = _spPageContextInfo.webAbsoluteUrl;
                test = false;
            } else {
                siteUrl = undefined;
                test = true;
            }
        }
        catch (e) {
            siteUrl = undefined;
            test = true;
        }

    function callData(siteUrl, type, title, columns, expand, filter, top) {

        var url = "",
            endpoint;

        if (!test) {
        	if (type !== 'web') {
            	url = siteUrl + "/_api/web/lists/GetByTitle('" + title + "')/items?$select=" + columns + "&$expand=" + expand + "&$filter=" + filter + "&$top=" + top;
        	} else {
        		url = siteUrl + "/_api/web/" + title;
        	}
            endpoint = d3.json(url).header("accept", "application/json;odata=nometadata");

        }
        else {
            url = instrg == 0 ? "../SiteAssets/data/" + title + ".json" : "../SiteAssets/data/" + title + ".js";
            endpoint = d3.json(url);
        }

        return endpoint;

    }

    columns = "Id,UII,InvestmentNumber,Component,InvestmentName,InvestmentType,Year,Total,PercentageChange,PercentageDME,PercentageSS,DME,SS";
    expand = "";
    filter = "";
    top = 3000;

    var componentEndpoint = callData(siteUrl, 'AnnualBudgetData', columns, expand, filter, top);

    // Get the data
    d3_queue.queue()
        .defer(componentEndpoint.get)
        .await(createViz);

}

$(document).ready(function() {
    getData();
});
