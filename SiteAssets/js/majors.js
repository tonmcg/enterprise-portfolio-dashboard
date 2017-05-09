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
    bottom: 20,
    left: 10
};

// var size = getSize();
// var height = size.height;
// var width = size.width;

var dashboardHeight = document.querySelector('div#dashboard.content').offsetHeight;
var navbarHeight = document.querySelector('nav.navbar').offsetHeight;

var areaChartHeaderHeight = document.querySelector('#areaChart .header').offsetHeight;
var areaChartFooterHeight = document.querySelector('#areaChart .content .footer .stats').offsetHeight;

var areaChartHeight = (dashboardHeight - navbarHeight - areaChartHeaderHeight - areaChartFooterHeight) * 1 / 4;

var ringChartHeaderHeight = document.querySelector('#ringChart .header').offsetHeight;
var ringChartFooterHeight = document.querySelector('#ringChart .content .footer .stats').offsetHeight;
var ringChartHeight = (dashboardHeight - navbarHeight - ringChartHeaderHeight - ringChartFooterHeight) * 1 / 4;

var rowChartHeaderHeight = document.querySelector('#rowChart .header').offsetHeight;
var rowChartFooterHeight = document.querySelector('#rowChart .content .footer .stats').offsetHeight;
var rowChartHeight = (dashboardHeight - navbarHeight - rowChartHeaderHeight - rowChartFooterHeight) * 1 / 2;

var areaChartWidth = document.querySelector('#areaChart .footer').clientWidth; // does not include margin, padding, or scroll bar widths
var ringChartWidth = document.querySelector('#ringChart .footer').clientWidth; // does not include margin, padding, or scroll bar widths
var rowChartWidth = document.querySelector('#rowChart .footer').clientWidth; // does not include margin, padding, or scroll bar widths

var legendOffset = areaChartWidth * 1 / 8;

// tick label and tooltip formats
var sFormat = d3.format("s"),
    dFormat = d3.format("d"),
    iFormat = d3.format(",.0f"),
    perFormat = d3.format("%.0f"),
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

// default values in selection drop down
var category = 'All Authorities';
var component = 'All Components';

// dc.js charts
var componentsSelect = dc.selectMenu('#components');
var categoriesSelect = dc.selectMenu('#categories');
var serviceTypesChart = dc.pieChart("#chart-serviceTypes");
var requestsChart = dc.lineChart("#chart-amount");
var servicesChart = dc.rowChart('#chart-services');

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

function refreshDataTable(dimension, datatable) {
    // dc.events.trigger(function() {
    var investmentData = dimension.top(Infinity);
    datatable.fnClearTable();
    datatable.fnAddData(investmentData);
    // datatable.fnDraw();
    // });
}

function resetFilter(dimension, chart) {
    dimension.filterAll();
}

function resetHeaders() {
    d3.select('#total-spend-header').text('Total IT Spend');
    d3.select('#filter-count-header').text('Selected Investments');
}

function createViz(error, data) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    var dataSet = data.value;

    // set crossfilter
    var ndx = crossfilter(dataSet);

    // define dimensions
    var
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
        }),
        idDim = ndx.dimension(function(d) {
            return d.Created;
        });

    // group dimensions
    var all = ndx.groupAll(),
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
        amountByMonth = timeDim.group().reduceSum(function(d) {
            return Math.round(d.ProcurementActionValue);
        }),
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

    var dateMin = d3.min(amountByMonth.top(Infinity).map(function(d) {
            return d.key;
        })),
        dateMax = d3.max(amountByMonth.top(Infinity).map(function(d) {
            return d.key;
        }));

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
        
    requestsChart
        .width(areaChartWidth)
        .height(areaChartHeight)
        .renderArea(true)
        .dimension(timeDim)
        .group(amountByMonth)
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left + 50
        })
        .dashStyle([3, 1, 1, 1])
        .renderDataPoints({
            radius: 5,
            fillOpacity: 0.8,
            strokeOpacity: 1
        })
        // .legend(dc.legend().x(areaChartWidth - legendOffset))
        .x(d3.time.scale().domain([dateMin, dateMax]))
        .round(d3.time.month.round)
        .xUnits(d3.time.month)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .brushOn(true)
        .renderLabel(false)
        .renderTitle(false)
        .yAxisLabel("Monthly Request Volume")
        .yAxis().ticks(Math.max(areaChartHeight / 50, 2)).tickFormat(function(d) {
            return formatAbbreviation(d);
        });

    serviceTypesChart
        .width(ringChartWidth)
        .height(ringChartHeight)
        .radius(ringChartWidth / 4)
        .dimension(serviceTypeDim)
        .group(amountByServiceType)
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .legend(dc.legend().y(0))
        .label(function(d) {
            if (serviceTypesChart.hasFilter() && !serviceTypesChart.hasFilter(d.key)) {
                return '0%';
            }
            var label = '';
            if (all.value()) {
                // label += ' (' + Math.round(d.value.amount / totalAmount.value() * 100) + '%)';
                d.value.percent = d.value.amount / totalAmount.value();
                label += perFormat(d.value.percent);
            }
            return label;
        })
        .renderTitle(false)
        .externalRadiusPadding(ringChartWidth / 105)
        .innerRadius(ringChartWidth / 10);
        
    dc.override(serviceTypesChart, 'legendables', function() {
        var items = serviceTypesChart._legendables();
        return items.reverse();
    }); // reverse order of legend items

    servicesChart
        .width(rowChartWidth)
        .height(rowChartHeight)
        .dimension(serviceDim)
        .group(amountByService)
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .label(function(d) {
            if (servicesChart.hasFilter() && !servicesChart.hasFilter(d.key)) {
                return d.key + ' (0%)';
            }
            var label = d.key;
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
            chart.selectAll('g.row text').style({
                'fill': function(d) {
                    var fill = '';
                    d.value.amount !== 0 ? fill = 'black' : fill = 'none';
                    return fill;
                }
            });
        })
        .renderTitle(false)
        .elasticX(true)
        .xAxis().tickFormat(sFormat);

    // http://stackoverflow.com/questions/21113513/reorder-datatable-by-column
    var datatable = $("#data-table").dataTable({
        "scrollY": rowChartHeight - 50 + 'px',
        "scrollCollapse": true,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": true,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "desc"]
        ],
        "columnDefs": [{
            "title": "Request Number",
            "targets": 0,
            "data": "Id",
            "defaultContent": "",
            "visible": false
        }, {
            "title": "Component",
            "targets": 1,
            "data": "Component",
            "defaultContent": ""
        }, {
            "title": "Title",
            "targets": 2,
            "data": "Title",
            "render": function(data, type, full, meta) {
                return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + full.Title + "</a>";
            }
        }, {
            "title": "Amount",
            "targets": 3,
            "data": "ProcurementActionValue",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.ProcurementActionValue);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            }
        }, {
            "title": "Shared IT Solution",
            "targets": 4,
            "data": "SharedITSolution",
            "defaultContent": "",
            "visible": false
        }, {
            "title": "Procurement Action",
            "targets": 5,
            "data": "ProcurementAction",
            "defaultContent": ""
        }, {
            "title": "Status",
            "targets": 6,
            "data": "ApprovalStatus",
            "defaultContent": ""
        }, {
            "title": "Approval Authority",
            "targets": 7,
            "data": "ApprovalAuthority",
            "defaultContent": ""
        }, {
            "title": "Submitted Date",
            "targets": 8,
            "type": "date",
            "data": "Created",
            "render": function(data, type, d) {
                return moment(d.Created).format('LL');
            },
        }, {
            "title": "Last Modified Date",
            "targets": 9,
            "data": "Modified",
            "render": function(data, type, d) {
                return moment(d.Modified).format('LL');
            },
            "visible": false
        }]
    });

    dc.renderAll();

    // define mouseover and mouseout events
    function bindHover() {
        d3.selectAll('g.row').on("mouseover", function(d) {
            var key = d.key;
            var amount = currFormat(d.value.amount);
            var count = d.value.count;
            var percent = perFormat(d.value.percent);
            showDetail( key, amount, count, percent )
        }).on("mouseout", hideDetail);
        d3.selectAll('g.pie-slice').on("mouseover", function(d) {
            var key = d.data.key;
            var amount = currFormat(d.data.value.amount);
            var count = d.data.value.count;
            var percent = perFormat(d.data.value.percent);
            showDetail( key, amount, count, percent )
        }).on("mouseout", hideDetail);
    }

    bindHover();

    function refreshTable() {
        dc.events.trigger(function() {
            var initiativeData = idDim.top(Infinity);
            datatable.fnClearTable();
            if (typeof initiativeData !== 'undefined' && initiativeData.length > 0) {
                datatable.fnAddData(initiativeData);
            }
        });
    }

    for (var i = 0; i < dc.chartRegistry.list().length; i++) {
        var chartI = dc.chartRegistry.list()[i];
        chartI.on("filtered", refreshTable);
    }

    // Change the date header to reflect the date and time of the data
    d3.select('#dateHeader').text(moment().format('LLL'));

    // define reset mouseover event
    d3.selectAll('.reset').on('mouseover', function(e) {
        $(this).css('cursor', 'pointer');
    });

    // define reset click events
    d3.select('#areaChartReset').on('click', function() {
        requestsChart.filterAll();
        dc.redrawAll();
    });
    d3.select('#ringChartReset').on('click', function() {
        serviceTypesChart.filterAll();
        dc.redrawAll();
    });
    d3.select('#rowChartReset').on('click', function() {
        servicesChart.filterAll();
        dc.redrawAll();
    });

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

    // https://www.safaribooksonline.com/blog/2014/02/17/building-responsible-visualizations-d3-js/
    var resizeCharts = debounce(function() {
        var newDashboardHeight = document.querySelector('div#dashboard.content').offsetHeight;
        var newNavbarHeight = document.querySelector('nav.navbar').offsetHeight;

        var newBarChartWidth = document.querySelector('#areaChart .footer').clientWidth;
        var legendOffset = newBarChartWidth * 1/8;
        requestsChart
            .width(newBarChartWidth)
            .legend(dc.legend().x(newBarChartWidth - legendOffset))
            .transitionDuration(0);

        var newRingChartWidth = document.querySelector('#ringChart .footer').clientWidth;
        var newRingChartHeaderHeight = document.querySelector('#ringChart .header').offsetHeight;
        var newRingChartFooterHeight = document.querySelector('#ringChart .content .footer .stats').offsetHeight;
        var newRingChartHeight = (newDashboardHeight - newNavbarHeight - newRingChartHeaderHeight - newRingChartFooterHeight) * 1 / 3;
        serviceTypesChart
            .width(newRingChartWidth)
            .height(newRingChartHeight)
            .radius(newRingChartWidth / 3)
            .externalRadiusPadding(newRingChartWidth / 35)
            .innerRadius(newRingChartWidth / 7)
            .transitionDuration(0);

        var newRowChartWidth = document.querySelector('#rowChart .footer').clientWidth;
        servicesChart
            .width(newRowChartWidth)
            .transitionDuration(0)
            .xAxis().ticks(Math.max(newRowChartWidth / 50, 2));

        dc.renderAll();
        requestsChart.transitionDuration(750);
        serviceTypesChart.transitionDuration(750);
        servicesChart.transitionDuration(750);

        // rebind hover events on charts
        bindHover();
    }, 25);

    window.addEventListener('resize', resizeCharts);

}

function exportTable() {
    export_table_to_excel('data-table', 'Requests');
} // parameters: 0, id of html table, 1, name of workbook

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

    columns = "UII/UII,UII/InvestmentTitle,ProjectID/ProjectID,ProjectID/ProjectName,ComponentInvestment/e0va";
    expand = "UII,ProjectID,ComponentInvestment";
    filter = "";
    top = 2000;

    var componentEndpoint = callData(siteUrl, 'ProjectData', columns, expand, filter, top);

    // Get the data
    d3_queue.queue()
        .defer(componentEndpoint.get)
        .await(createViz);

}

getData();