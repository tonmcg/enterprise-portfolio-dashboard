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

var dashboardHeight = getSize().height;
var headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
var footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

var barChartHeaderHeight = document.querySelector('#barChart header').offsetHeight;
var barChartFooterHeight = document.querySelector('#barChart footer').offsetHeight;

var stackChartHeight = (dashboardHeight - headerHeight - footerHeight - barChartHeaderHeight - barChartFooterHeight) * 1/8;
var groupChartHeight = (dashboardHeight - headerHeight - footerHeight - barChartHeaderHeight - barChartFooterHeight) * 1/8;

var rowChartHeaderHeight = document.querySelector('#rowChart header').offsetHeight;
var rowChartFooterHeight = document.querySelector('#rowChart footer').offsetHeight;
var rowChartHeight = (dashboardHeight - headerHeight - footerHeight - rowChartHeaderHeight - rowChartFooterHeight) * 1/2;

var ringChartHeaderHeight = document.querySelector('#ringChart header').offsetHeight;
var ringChartFooterHeight = document.querySelector('#ringChart footer').offsetHeight;
var ringChartHeight = (dashboardHeight - headerHeight - footerHeight - ringChartHeaderHeight - ringChartFooterHeight) * 1/4;

var tableHeaderHeight = document.querySelector('#tableChart header').offsetHeight;
var tableFooterHeight = document.querySelector('#tableChart footer').offsetHeight;
var tableHeight = (dashboardHeight - headerHeight - footerHeight - tableHeaderHeight - tableFooterHeight) * 1/2 * 0.85;

var barChartWidth = document.querySelector('#barChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
var ringChartWidth = document.querySelector('#ringChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
var rowChartWidth = document.querySelector('#rowChart footer').clientWidth; // does not include margin, padding, or scroll bar widths

var legendOffset = barChartWidth * 1 / 5;

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

// dc.js charts
var select = dc.selectMenu('#components');
var stackedChart = dc.barChart("#chart-realized");
var groupedChart = dc.barChart("#chart-projected");
var initiativesChart = dc.pieChart("#chart-initiatives");
var serviceTypesChart = dc.rowChart('#chart-serviceTypes');

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
        componentDim = ndx.dimension(function(d) {
            return d.Component;
        }),
        categoryDim = ndx.dimension(function(d) {
            return d.Category;
        }),        
        timeDim = ndx.dimension(function(d) {
            return d.Year;
        }),
        yearDim = ndx.dimension(function(d) {
            return d.Year;
        });

    // group dimensions
    var all = ndx.groupAll(),
        amountByComponent = componentDim.group().reduceSum(function(d) {
            return Math.round(d.Total);
        }),
        amountByFacilites = yearDim.group().reduce(
            if () {
                function(p, v) {
                    ++p.count;
                    p.amount += Math.round(v.Total) || 0;
                    return p;
                },
                function(p, v) {
                    --p.count;
                    p.amount -= Math.round(v.Total) || 0;
                    return p;
                },
                function() {
                    return {
                        count: 0,
                        amount: 0
                    };
                }
            }
        ),
        amountByEndUser = yearDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.Total) || 0;
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.Total) || 0;
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0
                };
            }
        ),
        savingsOverTime = timeDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.RealizedSavings) || 0;
                p.total += Math.round(v.Realized) || 0;

                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.RealizedSavings) || 0;
                p.total -= Math.round(v.Realized) || 0;

                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0,
                    total: 0,
                    percent: 0
                };
            }
        ),
        avoidanceOverTime = timeDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.RealizedAvoidance) || 0;
                p.total += Math.round(v.Realized) || 0;

                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.RealizedAvoidance) || 0;
                p.total -= Math.round(v.Realized) || 0;

                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0,
                    total: 0,
                    percent: 0
                };
            }
        ),
        amountByInitiative = initiativeDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.Realized) || 0;
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.Realized) || 0;
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0
                };
            }
        ),
        amountByServiceType = serviceTypeDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.Realized) || 0;
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.Realized) || 0;
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0
                };
            }
        ),
        totalAmount = ndx.groupAll().reduceSum(function(d) {
            return Math.round(d.Total);
        });

    // menuselect
    select
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

    select.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#components').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });

    // displays
    dc.numberDisplay("#total-initiatives")
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
    groupedChart
        .width(barChartWidth)
        .height(groupChartHeight)
        .groupBars(true)
        .groupGap(20)
        .centerBar(true)
        .dimension(yearDim)
        .group(amountByEndUser, "Projected")
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .stack(amountByRealized, "Realized", function(d) {
            return d.value.amount;
        })
        .ordinalColors(colorbrewer.Set1[3].slice(0,2).reverse())
        .x(d3.scale.ordinal().domain(years))
        .elasticX(false)
        .xUnits(dc.units.ordinal)
        // .barPadding(0.15)
        // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
        .legend(dc.legend().x(barChartWidth - legendOffset))
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left + 50
        })
        .renderLabel(false)
        .renderTitle(false)
        .renderHorizontalGridLines(true)
        .elasticY(true)
        .yAxisLabel("Realized v Projected")
        .yAxis().ticks(Math.max(stackChartHeight / 50, 2)).tickFormat(function(d) {
            return formatAbbreviation(d);
        });

    groupedChart.addFilterHandler(function (filters, filter) {
        filters.length = 0; // empty the array
        filters.push(filter);
        return filters;
    });
    
    groupedChart.on('pretransition',function(chart) {
        setResponsiveSVG(chart);
    });
    
    stackedChart
        .width(barChartWidth)
        .height(stackChartHeight)
        .groupBars(false)
        .dimension(timeDim)
        .group(savingsOverTime, "Realized Savings")
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .stack(avoidanceOverTime, "Realized Avoidance", function(d) {
            return d.value.amount;
        })
        .ordinalColors(colorbrewer.PuOr[4])
        .x(d3.scale.ordinal().domain(years))
        .elasticX(false)
        .xUnits(dc.units.ordinal)
        .barPadding(0.15)
        // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
        .legend(dc.legend().x(barChartWidth - legendOffset))
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left + 50
        })
        .renderLabel(false)
        .renderTitle(false)
        .renderHorizontalGridLines(true)
        .elasticY(true)
        .yAxisLabel("Realized IT CSA")
        .yAxis().ticks(Math.max(stackChartHeight / 50, 2)).tickFormat(function(d) {
            return formatAbbreviation(d);
        });
        
    stackedChart.addFilterHandler(function (filters, filter) {
        filters.length = 0; // empty the array
        filters.push(filter);
        return filters;
    });
    
    stackedChart.on('pretransition',function(chart) {
        setResponsiveSVG(chart);
    });
    
    initiativesChart
        .width(ringChartWidth)
        .height(ringChartHeight)
        .radius(ringChartWidth / 4)
        .dimension(initiativeDim)
        .group(amountByInitiative)
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        // .ordinalColors(pieColors)
        .legend(dc.legend().y(0))
        .label(function(d) {
            if (initiativesChart.hasFilter() && !initiativesChart.hasFilter(d.key)) {
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
        .externalRadiusPadding(ringChartWidth / 10)
        .innerRadius(ringChartWidth / 15);

    initiativesChart.on('pretransition',function(chart) {
        setResponsiveSVG(chart);
    });

    dc.override(initiativesChart, 'legendables', function() {
        var items = initiativesChart._legendables();
        return items.reverse();
    }); // reverse order of legend items


    serviceTypesChart
        .width(rowChartWidth)
        .height(rowChartHeight)
        .dimension(serviceTypeDim)
        .group(amountByServiceType)
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .label(function(d) {
            if (serviceTypesChart.hasFilter() && !serviceTypesChart.hasFilter(d.key)) {
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
        // .rowsCap(10)
        .othersGrouper(false)
        .ordering(function(d) {
            return -d.value.amount;
        })
        .on('pretransition', function(chart) {
            setResponsiveSVG(chart);
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
        "scrollY": tableHeight + 'px',
        "scrollCollapse": true,
        "responsive": true,
        "paginate": false,
        "bLengthChange": false,
        "filter": false,
        "sort": true,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": initiativeDim.top(Infinity),
        "destroy": true,
        "order": [
            [4, "asc"]
        ],
        "columnDefs": [{
            "title": "Strategy ID",
            "targets": 0,
            "data": "Id",
            "defaultContent": ""
        }, {
            "title": "Year",
            "targets": 1,
            "data": "Year",
            "defaultContent": ""
        }, {
            "title": "Component",
            "targets": 2,
            "data": "Component",
            "defaultContent": ""
        }, {
            "title": "Strategy Title",
            "targets": 3,
            "data": "Title",
            "render": function(data, type, full, meta) {
                return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + full.Title + "</a>";
            }
        }, {
            "title": "Realized Savings",
            "targets": 4,
            "data": "RealizedSavings",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.TotalSavings);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            }
        }, {
            "title": "Realized Avoidance",
            "targets": 5,
            "data": "RealizedAvoidance",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.TotalAvoidance);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            }
        }, {
            "title": "Total",
            "targets": 6,
            "data": "Realized",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.Total);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            }
        }, {
            "title": "Use of Savings or Avoidance",
            "targets": 7,
            "data": "Description",
            "defaultContent": ""
        }, {
            "title": "Primary POC",
            "targets": 8,
            "data": "POC",
            "defaultContent": ""
        }, {
            "title": "Details of Strategy",
            "targets": 9,
            "data": "Details",
            "defaultContent": ""
        }, {
            "title": "Decision Date",
            "targets": 10,
            "data": "Date",
            "render": function(data, type, full, meta) {
                return moment(full.Date).format('LL');
            }
        }, {
            "title": "OMB Initiative",
            "targets": 11,
            "data": "Initiative",
            "defaultContent": ""
        }, {
            "title": "IT Service Type",
            "targets": 12,
            "data": "ITServiceType",
            "defaultContent": ""
        }, {
            "title": "Related UIIs",
            "targets": 13,
            "data": "RelatedUIIs",
            "render": function(data, type, full, meta) {
                return full.RelatedUIIs || "N/A";
            }
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
            // var percent = perFormat(d.data.value.percent);
            showDetail( key, amount, count, null )
        }).on("mouseout", hideDetail);
        d3.selectAll('#chart-realized g.stack rect.bar').on("mouseover", function(d) {
            var key = d.layer;
            var amount = currFormat(d.data.value.amount);
            var percent = perFormat(d.data.value.percent);
            showDetail( key, amount, null, percent )
        }).on("mouseout", hideDetail);
        d3.selectAll('#chart-projected g.stack rect.bar').on("mouseover", function(d) {
            var key = d.layer;
            var amount = currFormat(d.data.value.amount);
            // var percent = perFormat(d.data.value.percent);
            showDetail( key, amount, null, null )
        }).on("mouseout", hideDetail);
    }

    bindHover();

    function refreshTable() {
        dc.events.trigger(function() {
            var initiativeData = initiativeDim.top(Infinity);
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
    d3.select('#barChartReset').on('click', function() {
        stackedChart.filterAll();
        dc.redrawAll();
    });
    d3.select('#ringChartReset').on('click', function() {
        initiativesChart.filterAll();
        dc.redrawAll();
    });
    d3.select('#rowChartReset').on('click', function() {
        serviceTypesChart.filterAll();
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
    //     var newDashboardHeight = document.querySelector('div#dashboard.content').offsetHeight;
    //     var newNavbarHeight = document.querySelector('nav.navbar').offsetHeight;

    //     var newBarChartWidth = document.querySelector('#barChart .footer').clientWidth;
    //     var legendOffset = newBarChartWidth * 1/8;
    //     stackedChart
    //         .width(newBarChartWidth)
    //         .legend(dc.legend().x(newBarChartWidth - legendOffset))
    //         .transitionDuration(0);
    //     groupedChart
    //         .width(newBarChartWidth)
    //         .legend(dc.legend().x(newBarChartWidth - legendOffset))
    //         .transitionDuration(0);

    //     var newRingChartWidth = document.querySelector('#ringChart .footer').clientWidth;
    //     var newRingChartHeaderHeight = document.querySelector('#ringChart .header').offsetHeight;
    //     var newRingChartFooterHeight = document.querySelector('#ringChart .content .footer .stats').offsetHeight;
    //     var newRingChartHeight = (newDashboardHeight - newNavbarHeight - newRingChartHeaderHeight - newRingChartFooterHeight) * 1 / 3;
    //     initiativesChart
    //         .width(newRingChartWidth)
    //         .height(newRingChartHeight)
    //         .radius(newRingChartWidth / 3)
    //         .externalRadiusPadding(newRingChartWidth / 35)
    //         .innerRadius(newRingChartWidth / 7)
    //         .transitionDuration(0);

    //     var newRowChartWidth = document.querySelector('#rowChart .footer').clientWidth;
    //     serviceTypesChart
    //         .width(newRowChartWidth)
    //         .transitionDuration(0)
    //         .xAxis().ticks(Math.max(newRowChartWidth / 50, 2));

    //     dc.renderAll();
    //     initiativesChart.transitionDuration(750);
    //     serviceTypesChart.transitionDuration(750);
    //     stackedChart.transitionDuration(750);
    //     groupedChart.transitionDuration(750);

    //     // rebind hover events on charts
    //     bindHover();
    // }, 25);

    // window.addEventListener('resize', resizeCharts);

}

function exportTable() {
    export_table_to_excel('data-table', 'Initiatives');
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

    columns = "Id,Component,Category,InvestmentName,Year,Value";
    expand = "";
    filter = "(Value ne 0)";
    top = 9000;

    var componentEndpoint = callData(siteUrl, 'ISCA', columns, expand, filter, top);

    // Get the data
    d3_queue.queue()
        .defer(componentEndpoint.get)
        .await(createViz);

}

getData();