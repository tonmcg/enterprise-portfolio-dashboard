"use strict";

// create spinner
let target = d3.select("#dashboard").node();
// create tooltip
let tooltip = d3.select("body").append("div").style({
    "position": "absolute",
    "z-index": "10",
    "visibility": "hidden"
}).attr({
    "class": "tooltip"
});
// trigger loader
let spinner = new Spinner(opts).spin(target);

function createViz(error, data) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    // dimensions for the charts
    const dashboardHeight = getSize().height;
    const headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
    const footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

    const areaChartHeaderHeight = document.querySelector('#areaChart header').offsetHeight;
    const areaChartFooterHeight = document.querySelector('#areaChart footer').offsetHeight;
    const areaChartHeight = (dashboardHeight - headerHeight - footerHeight - areaChartHeaderHeight - areaChartFooterHeight) * 1 / 3;

    const ringChartHeaderHeight = document.querySelector('#ringChart header').offsetHeight;
    const ringChartFooterHeight = document.querySelector('#ringChart footer').offsetHeight;
    const ringChartHeight = (dashboardHeight - headerHeight - footerHeight - ringChartHeaderHeight - ringChartFooterHeight) * 1 / 3;

    const rowChartHeaderHeight = document.querySelector('#rowChart header').offsetHeight;
    const rowChartFooterHeight = document.querySelector('#rowChart footer').offsetHeight;
    const rowChartHeight = (dashboardHeight - headerHeight - footerHeight - rowChartHeaderHeight - rowChartFooterHeight) * 5 / 12;

    const tableHeaderHeight = document.querySelector('#tableChart header').offsetHeight;
    const tableFooterHeight = document.querySelector('#tableChart footer').offsetHeight;
    const tableHeight = (dashboardHeight - headerHeight - footerHeight - tableHeaderHeight - tableFooterHeight) * 5 / 12 * 0.8;

    const areaChartWidth = document.querySelector('#areaChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
    const ringChartWidth = document.querySelector('#ringChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
    const rowChartWidth = document.querySelector('#rowChart footer').clientWidth; // does not include margin, padding, or scroll bar widths

    const legendOffset = areaChartWidth * 1 / 8;

    const margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };

    // data preparation
    let results = data.value.map(function(d) {
        if (d.SharedITSolution == 'YES - Multi Component') {
            d.SharedITSolution = 'Multi Component';
        }
        if (d.SharedITSolution == 'YES - Enterprise') {
            d.SharedITSolution = 'Enterprise';
        }
        if (d.SharedITSolution == 'NO - Single Component') {
            d.SharedITSolution = 'Single Component';
        }
        if (d.ApprovalAuthority == 'DOJ CIO') {
            d.Category = '> $2.5M';
            d.ApprovalCategory = d.ApprovalAuthority + ': ' + d.Category;
        }
        if (d.ApprovalAuthority == 'Component') {
            d.Category = '<= $500K';
            d.ApprovalCategory = d.ApprovalAuthority + ': ' + d.Category;
        }
        if (d.ApprovalAuthority == 'CIO Intake Board') {
            d.Category = '> $500K and <= $2.5M';
            d.ApprovalCategory = d.ApprovalAuthority + ': ' + d.Category;
        }

        d.Component = d.Component.Title;
        d.ITService = d.ITService == null ? "" : d.ITService.Title;
        d.ITServiceType = d.ITServiceType.Title;
        if (d.ITServiceType == 'IT Practices and Management') {
            d.ITServiceType = 'IT Prac. & Mngmt';
        }
        d.ApprovalStatus = d.ApprovalStatus.Title;
        
        // randomize results for public viewing
        d.ProcurementActionValue = Math.random()*1000;

        d.dd = moment(d.Created)._d; // dc.js round months to beginning of month
        d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        return d;
    });

    // set crossfilter
    let ndx = crossfilter(results);

    // define dimensions
    let
        componentDim = ndx.dimension(function(d) {
            return d.Component;
        }),
        categoryDim = ndx.dimension(function(d) {
            return d.ApprovalAuthority;
        }),
        serviceDim = ndx.dimension(function(d) {
            return d.ITService;
        }),
        timeDim = ndx.dimension(function(d) {
            return d.month;
        }),
        serviceTypeDim = ndx.dimension(function(d) {
            return d.ITServiceType;
        });

    // group dimensions
    let all = ndx.groupAll(),
        amountByComponent = componentDim.group().reduceSum(function(d) {
            return Math.round(d.ProcurementActionValue);
        }),
        amountByCategory = categoryDim.group().reduceSum(function(d) {
            return Math.round(d.ProcurementActionValue);
        }),
        amountByServiceType = serviceTypeDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.ProcurementActionValue);
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.ProcurementActionValue);
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0
                };
            }
        ),
        countByMonth = timeDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.ProcurementActionValue);
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.ProcurementActionValue);
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0
                };
            }
        ),
        amountByMonth = timeDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.ProcurementActionValue);
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.ProcurementActionValue);
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0
                };
            }
        ),
        amountByService = serviceDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.ProcurementActionValue);
                // p.percent = +(p.amount/totalAmount.value());
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.ProcurementActionValue);
                // p.percent = +(p.amount/totalAmount.value());
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0
                        // percent: 0
                };
            }
        ).order(function(p) {
            return p.amount;
        }),
        totalAmount = ndx.groupAll().reduceSum(function(d) {
            return Math.round(d.ProcurementActionValue);
        });

    let dateMin = d3.min(amountByMonth.top(Infinity).map(function(d) {
            return d.key;
        })),
        dateMax = d3.max(amountByMonth.top(Infinity).map(function(d) {
            return d.key;
        }));

    let countMax = d3.max(amountByMonth.top(Infinity).map(function(d) {
        return d.value.count;
    }));

    let amountMax = d3.max(amountByMonth.top(Infinity).map(function(d) {
        return d.value.amount;
    }));

    // dc.js charts
    let componentsSelect = dc.selectMenu('#components');
    let categoriesSelect = dc.selectMenu('#categories');
    let serviceTypesChart = dc.pieChart("#chart-serviceTypes");
    let requestsChart = dc.compositeChart("#chart-amount");
    let servicesChart = dc.rowChart('#chart-services');

    // menuselect
    componentsSelect
        .dimension(componentDim)
        .group(amountByComponent)
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

    componentsSelect.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#components').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });

    categoriesSelect
        .dimension(categoryDim)
        .group(amountByCategory)
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
        .promptText('All Authorities')
        .promptValue(null);

    categoriesSelect.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#categories').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });

    // displays
    dc.numberDisplay("#total-requests")
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

    let requestsBarChart = dc.barChart(requestsChart)
        // .dimension(timeDim)
        .group(amountByMonth, "Monthly Amount")
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .ordinalColors(colorbrewer.PuOr[6])
        .barPadding(0.15)
        .centerBar(true);

    let requestsLineChart = dc.lineChart(requestsChart)
        .dimension(timeDim)
        .group(countByMonth, "Monthly Count")
        .valueAccessor(function(d) {
            return d.value.count;
        })
        .dotRadius(3)
        .renderDataPoints({
            radius: 3,
            fillOpacity: 0.8,
            strokeOpacity: 1
        })
        .interpolate("linear")
        .renderArea(false)
        .tension(1)
        .colors(colorbrewer.PuOr[3][2])
        .xyTipsOn(true)
        .useRightYAxis(true);
        
    requestsChart
        .width(areaChartWidth)
        .height(areaChartHeight)
        // .dimension(timeDim)
        .x(d3.time.scale().domain([dateMin, dateMax]))
        .round(d3.time.month.round)
        .y(d3.scale.linear().domain([0, amountMax]))
        .yAxisLabel("Monthly Request Volume")
        .rightY(d3.scale.linear().domain([0, countMax]))
        .rightYAxisLabel("Monthly Request Count")
        .margins({
            top: margins.top,
            right: margins.right + 50,
            bottom: margins.bottom,
            left: margins.left + 60
        })
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .brushOn(false)
        .renderLabel(false)
        .renderTitle(false)
        .alignYAxes(false)
        .legend(dc.legend().legendText(function(d) { 
            return d.name;
        }).horizontal(false).x(areaChartWidth / 2))
        .xUnits(function(d) {
            return 15; // this seems to be the magic number to get the right widths on the bars
        })
        .compose([requestsBarChart,requestsLineChart]);
        
    requestsChart.rightYAxis().ticks(Math.max(areaChartHeight / 50, 2)).tickFormat(function(d) {
        return d;
    });
    requestsChart.yAxis().ticks(Math.max(areaChartHeight / 50, 2)).tickFormat(function(d) {
        return formatAbbreviation(d);
    });

    requestsChart.on('pretransition', function(chart) {
        setResponsiveSVG(chart);
    });

    serviceTypesChart
        .width(ringChartWidth)
        .height(ringChartHeight)
        .radius(d3.min([ringChartWidth, ringChartHeight]) / 2)
        .externalLabels(d3.min([ringChartWidth, ringChartHeight]) / 8)
        .externalRadiusPadding(d3.min([ringChartWidth, ringChartHeight]) / 8)
        .dimension(serviceTypeDim)
        .group(amountByServiceType)
        .ordinalColors(colorbrewer.PuOr[6])
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .drawPaths(false)
        // .legend(dc.legend().y(0))
        // .label(function(d) {
        //     if (serviceTypesChart.hasFilter() && !serviceTypesChart.hasFilter(d.key)) {
        //         return d.key + ' (0%)';
        //     }
        //     let label = '';
        //     if (all.value()) {
        //         // label += ' (' + Math.round(d.value.amount / totalAmount.value() * 100) + '%)';
        //         d.value.percent = d.value.amount / totalAmount.value();
        //         label += d.key + ' (' + perFormat(d.value.percent) + ')';
        //     }
        //     return label;
        // })
        .renderTitle(false)
        .innerRadius(d3.min([ringChartWidth, ringChartHeight]) / 5);

    serviceTypesChart.on('pretransition', function(chart) {
        setResponsiveSVG(chart);
    });

    servicesChart
        .width(rowChartWidth)
        .height(rowChartHeight)
        .dimension(serviceDim)
        .group(amountByService)
        .ordinalColors(colorbrewer.PuOr[9])
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .label(function(d) {
            if (servicesChart.hasFilter() && !servicesChart.hasFilter(d.key)) {
                return d.key + ' (0%)';
            }
            let label = d.key;
            if (all.value()) {
                // label += ' (' + Math.round(d.value.amount / totalAmount.value() * 100) + '%)';
                d.value.percent = d.value.amount / totalAmount.value();
                label += ' (' + perFormat(d.value.percent) + ')';
            }
            return label;
        })
        .title(function(d) {
            return d.value.amount;
        })
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left
        })
        .rowsCap(10)
        .othersGrouper(false)
        .ordering(function(d) {
            return -d.value.amount;
        })
        .on('pretransition', function(chart) {
            setResponsiveSVG(chart);

            chart.selectAll('g.row text').style({
                'fill': function(d) {
                    let fill = '';
                    d.value.amount !== 0 ? fill = 'black' : fill = 'none';
                    return fill;
                }
            });
        })
        .renderTitle(false)
        .elasticX(true)
        .xAxis().tickFormat(sFormat);

    dc.renderAll();

    // define mouseover and mouseout events
    function bindHover() {
        
        document.body.addEventListener('mouseover',function( e ) {
            if (e.target.parentElement.classList.contains('row')) {
                var d = d3.select(e.target).data()[0];
                let key = d.key;
                let amount = currFormat(d.value.amount);
                let count = d.value.count;
                let percent = perFormat(d.value.percent);
                showDetail(e, key, amount, count, percent)
            } else if (e.target.nodeName == 'rect' && e.target.classList.contains('bar')) {
                let d = d3.select(e.target).data()[0];
                let key = d.layer;
                let amount = currFormat(d.data.value.amount);
                showDetail(e, key, amount, null, null)
            } else if (e.target.parentElement.classList.contains('pie-slice') || e.target.classList.contains('pie-label')) {
                var d = d3.select(e.target).data()[0].data;
                let key = d.key;
                let amount = currFormat(d.value.amount);
                let count = d.value.count;
                let percent = perFormat(d.value.percent);
                showDetail(e, key, amount, count, percent)
            }
        });
        
        document.body.addEventListener('mouseout',function( e ) {
            if (e.target.parentElement.classList.contains('row') || e.target.nodeName == 'rect' || e.target.parentElement.classList.contains('pie-slice')  || e.target.classList.contains('pie-label')) hideDetail();
        });
    }

    bindHover();

    // Change the date header to reflect the date and time of the data
    d3.select('#dateHeader').text(moment().format('LLL'));

}

// if this JavaScript source file resides on a SharePoint server
// the function will return an endpoint Url pointing to a specified SharePoint list
// if not, the endpoint will point to a json file
function getData() {

    let test = '';
    let siteUrl = '';
    let columns = '';
    let expand = '';
    let filter = '';
    let top = '';

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

        let url = "",
            endpoint;

        if (!test) {
            if (type !== 'web') {
                url = siteUrl + "/_api/web/lists/GetByTitle('" + title + "')/items?$select=" + columns + "&$expand=" + expand + "&$filter=" + filter + "&$top=" + top;
            }
            else {
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

    columns = "ID,Title,ProcurementActionValue,Component/Title,ApprovalStatus/Title,ITServiceType/Title,ITService/Title,ApprovalAuthority,Created";
    expand = "Component,ApprovalStatus,ITServiceType,ITService";
    filter = "ApprovalStatus/Title ne 'Saved'";
    top = 3000;

    let componentEndpoint = callData('https://itim.doj.gov/itar', 'list', 'Requests', columns, expand, filter, top);

    // Get the data
    componentEndpoint.get(function(error, data) {
        createViz(error, data);
    });

}

getData();