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
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};

// var size = getSize();
// var height = size.height;
// var width = size.width;

var dashboardHeight = getSize().height;
var headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
var footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

var chartHeaderHeight = document.querySelector('#bubbleChart header').offsetHeight;
var chartFooterHeight = document.querySelector('#bubbleChart footer').offsetHeight;
var chartHeight = (dashboardHeight - headerHeight - footerHeight - chartHeaderHeight - chartFooterHeight) * 1/3;
var chartWidth = document.querySelector('#bubbleChart footer').clientWidth; // does not include margin, padding, or scroll bar widths

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
var compositionTreemapChart = dc.treeMap('#component');
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

    var data = componentsData.value.filter(function(d) {
        // Id,InvestmentNumber,Category,InvestmentName,Year,Total
        d.Total = +d.Value * 1000;
        d.Year = +d.Year;
        return d.Total !== 0;
    });

    // set crossfilter
    var ndx = crossfilter(data);

    // define dimensions
    var
        treemapDim = ndx.dimension(function(d) {
            return [d.InvestmentName, d.Category];
        }),
        timeDim = ndx.dimension(function(d) {
            return d.Year;
        }),
        component2Dim = ndx.dimension(function(d) {
            return d.Component;
        }),
        idDim = ndx.dimension(function(d) {
            return d.Category;
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
        amountByInvestmentByCategory = treemapDim.group().reduceSum(function(d) {
            return Math.round(d.Total);
        }),
        // amountByInvestmentByCategory = treemapDim.group().reduce(
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
        // // remove select all years option from select
        // var firstChild = chart.select('select').node().firstElementChild;
        // if (!firstChild.value) {
        //     d3.select(chart.select('select').node().firstElementChild).remove();
        // }
    });
    
    yearSelect.filter(2017);

    // fiscal year menuselect
    componentSelect
        .dimension(component2Dim)
        .group(selectByComponent)
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
        .promptText('All Components')
        .promptValue(null);

    componentSelect.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#components').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
        // var select = chart.select('select')
        // select
        //     .classed('form-control', true)
        //     .attr('multiple','multiple');
        // var firstChild = chart.select('select').node().firstElementChild;
        // if (!firstChild.value) {
        //     d3.select(chart.select('select').node().firstElementChild).remove();
        // }
        // $('#components>select').multiselect({numberDisplayed: 0});
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
    compositionTreemapChart
        .width(chartWidth)
        .height(chartHeight)
        .dimension(treemapDim)
        .group(amountByInvestmentByCategory)
        .ordinalColors(colorbrewer.Set3[9])
        .keyAccessor([
            function(d) {
                return d.key[1];
            },
            function(d) {
                return d.key[0];
            }
        ])
        .valueAccessor(function(d) {
            return d.value;
        })
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left
        })
        .renderTitle(false)
        ;

    compositionTreemapChart.colorAccessor(compositionTreemapChart.valueAccessor());
    
    compositionTreemapChart.on('pretransition', function(chart) {
        // setResponsiveSVG(chart);
    });

    // map data headers to column headers
    var cols = [{"label":"UII","column":"UII"},{"label":"Year","column":"Year"},{"label":"Category","column":"Category"},{"label":"Investment Name","column":"InvestmentName"},{"label":"Total","column":"Total"}];
    
    dataTable
        .width(tableWidth)
        .height(tableHeight)
        .dimension(idDim)
        .group(function (d) {
            return d.Id;
        })
        .columns([
            {
                label: cols[0].label,
                format: function(d) { return d[cols[0].column]; }
            },
            {
                label: cols[1].label,
                format: function(d) { return d[cols[1].column]; }
            },
            {
                label: cols[2].label,
                format: function(d) { return d[cols[2].column]; }
            },
            {
                label: cols[3].label,
                format: function(d) { return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + d[cols[3].column] + "</a>"; }
            },
            {
                label: cols[4].label,
                format: function(d) { return formatAbbreviation(d[cols[4].column]); }
            }
            ])
        .sortBy(function (d) { return d.Category; })
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
        // d3.selectAll('g.children').on("mouseover", function(d) {
        //     var key = d.key;
        //     var amount = currFormat(d.value);
        //     // var count = currFormat(d.value.count);
        //     showDetail(key, amount, null, null)
        // }).on("mouseout", hideDetail);
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
                return a.Category - b.Category;
            });
            sortAscending = false;
            this.className = 'aes';
        } else {
            rows.sort(function(a, b) { 
                return b.Category - a.Category;
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

}

function exportTable() {
    export_table_to_excel('data-table', 'ISCA'); // parameters: 0, id of html table, 1, name of workbook
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

    // test if on SharePoint
    try {
        if (typeof _spPageContextInfo !== undefined) {
            siteUrl = _spPageContextInfo.webAbsoluteUrl;
            test = false;
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
            url = "../SiteAssets/data/" + title + ".json";
            endpoint = d3.json(url);
        }

        return endpoint;

    }

    columns = "Id,Component,Category,InvestmentName,Year,Value";
    expand = "";
    filter = "";
    top = 9000;

    var componentEndpoint = callData(siteUrl, 'ISCA', columns, expand, filter, top);

    // Get the data
    d3_queue.queue()
        .defer(componentEndpoint.get)
        .await(createViz);

}

$(document).ready(function() {
    getData();
});