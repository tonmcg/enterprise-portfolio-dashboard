"use strict";

// create spinner
let target = d3.select("#dashboard").node();
// create tooltip
let tooltip = d3.select("body").append("div").style({"position": "absolute","z-index": "10","visibility": "hidden"}).attr({"class": "tooltip"});
// trigger loader
let spinner = new Spinner(opts).spin(target);

function createViz(error, data) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    const dashboardHeight = getSize().height;
    const headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
    const footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

    var chartHeaderHeight = document.querySelector('#bubbleChart header').offsetHeight;
    var chartFooterHeight = document.querySelector('#bubbleChart footer').offsetHeight;
    var chartHeight = (dashboardHeight - headerHeight - footerHeight - chartHeaderHeight - chartFooterHeight) * 5/6;
    var chartWidth = document.querySelector('#bubbleChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
    
    const margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };
    
    var results = data.value.map(function(d) {
        // Id,InvestmentNumber,Category,InvestmentName,Year,Total
        d.Total = +d.Value * 1000;
        d.Year = +d.Year;
        return d;
    });

    // set crossfilter
    var ndx = crossfilter(results);

    // define dimensions
    var
        treemapDim = ndx.dimension(function(d) {
            return [d.Service, d.Category,d['Business Area']];
        }),
        timeDim = ndx.dimension(function(d) {
            return d.Year;
        }),
        component2Dim = ndx.dimension(function(d) {
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
    
    // dc.js chart types
    var yearSelect = dc.selectMenu('#years');
    var componentSelect = dc.selectMenu('#components');
    // var compositionbubbleChart = dc.bubbleChart('#component');
    var compositionTreemapChart = dc.treeMap('#component');
    
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
                return d.key[2];
            },
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

    dc.renderAll();

    // define mouseover and mouseout events
    function bindHover() {
        // d3.selectAll('g.node').on("mouseover", function(d) {
        //     var key = d.key;
        //     var amount = currFormat(d.value.amount);
        //     var count = d.value.count;
        //     showDetail(key, amount, count, null)
        // }).on("mouseout", hideDetail);
        // d3.selectAll('g.children rect.parent').on("mouseover", function(d) {
        //     var key = d.key;
        //     var amount = currFormat(d.value);
        //     // var count = currFormat(d.value.count);
        //     showDetail(key, amount, null, null)
        // }).on("mouseout", hideDetail);
    }

    bindHover();
    
    // Change the date header to reflect the date and time of the data
    d3.select('#dateHeader').text(formatDate(new Date()));

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

    var componentEndpoint = callData(siteUrl, 'list', 'ISCA', columns, expand, filter, top);

    // Get the data
    d3_queue.queue()
        .defer(componentEndpoint.get)
        .await(createViz);

}

$(document).ready(function() {
    getData();
});