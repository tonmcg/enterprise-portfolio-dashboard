"use strict";

// define data
let columns = [{
    "label": "Strategy ID",
    "field": "Id",
    "format": function(d) { return d.Id; },
    "type": "string",
    "display": false,
    "sort": false
}, {
    "label": "Year",
    "field": "Year",
    "format": function(d) { return d.Year; },
    "type": "string",
    "display": false,
    "sort": false
}, {
    "label": "Details of Strategy",
    "field": "Details",
    "format": function(d) { return d.Details; },
    "type": "string",
    "display": false,
    "sort": false
}, {
    "label": "Decision Date",
    "field": "Date",
    "format": function(d) { return d.Date; },
    "type": "date",
    "display": false,
    "sort": false
}, {
    "label": "OMB Initiative",
    "field": "Initiative",
    "format": function(d) { return d.Initiative; },
    "type": "string",
    "display": false,
    "sort": false
}, {
    "label": "IT Service Type",
    "field": "ITServiceType",
    "format": function(d) { return d.ITServiceType; },
    "type": "string",
    "display": false,
    "sort": false
}, {
    "label": "Related UIIs",
    "field": "RelatedUIIs",
    "format": function(d) { return d.RelatedUIIs; },
    "type": "string",
    "display": false,
    "sort": false
}, {
    "label": "Component",
    "field": "Component",
    "format": function(d) { return d.Component; },
    "type": "string",
    "display": true,
    "sort": true
}, {
    "label": "Strategy Title",
    "field": "Title",
    "format": function(d) { return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + d.Title + "</a>"; },
    "type": "string",
    "display": true,
    "sort": false
}, {
    "label": "Primary POC",
    "field": "POC",
    "format": function(d) { return d.POC; },
    "type": "string",
    "display": true,
    "sort": false
}, {
    "label": "Realized Savings",
    "field": "RealizedSavings",
    "format": function(d) { return currFormat(d.RealizedSavings); },
    "type": "double",
    "display": true,
    "sort": false
}, {
    "label": "Realized Avoidance",
    "field": "RealizedAvoidance",
    "format": function(d) { return currFormat(d.RealizedAvoidance); },
    "type": "double",
    "display": true,
    "sort": false
}, {
    "label": "Total",
    "field": "Realized",
    "format": function(d) { return currFormat(d.Realized); },
    "type": "double",
    "display": true,
    "sort": false
}];
    
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
    
    const barChartHeaderHeight = document.querySelector('#barChart header').offsetHeight;
    const barChartFooterHeight = document.querySelector('#barChart footer').offsetHeight;
    
    const stackChartHeight = (dashboardHeight - headerHeight - footerHeight - barChartHeaderHeight - barChartFooterHeight) * 1/6;
    const groupChartHeight = (dashboardHeight - headerHeight - footerHeight - barChartHeaderHeight - barChartFooterHeight) * 1/6;
    
    const ringChartHeaderHeight = document.querySelector('#ringChart header').offsetHeight;
    const ringChartFooterHeight = document.querySelector('#ringChart footer').offsetHeight;
    const ringChartHeight = (dashboardHeight - headerHeight - footerHeight - ringChartHeaderHeight - ringChartFooterHeight) * 1 / 3;
    
    const rowChartHeaderHeight = document.querySelector('#rowChart header').offsetHeight;
    const rowChartFooterHeight = document.querySelector('#rowChart footer').offsetHeight;
    const rowChartHeight = (dashboardHeight - headerHeight - footerHeight - rowChartHeaderHeight - rowChartFooterHeight) * 5 / 12;
    
    const tableHeaderHeight = document.querySelector('#tableChart header').offsetHeight;
    const tableFooterHeight = document.querySelector('#tableChart footer').offsetHeight;
    const tableHeight = (dashboardHeight - headerHeight - footerHeight - tableHeaderHeight - tableFooterHeight) * 5 / 12 * 0.5;
    
    const tableWidth = document.querySelector('#tableChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
    
    const barChartWidth = document.querySelector('#barChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
    const ringChartWidth = document.querySelector('#ringChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
    const rowChartWidth = document.querySelector('#rowChart footer').clientWidth; // does not include margin, padding, or scroll bar widths
    
    const legendOffset = barChartWidth * 1 / 5;

    const margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };
    
    var results = [];
    var years = [];

    data.value.forEach(function(d) {
        
        for (var i = 12; i < 20; i++) {
            var series = {};
            series.Id = d.StrategyID;
            series.Title = d.Title;
            series.Component = d.Component_x0020_Name;
            series.POC = d.Primary_x0020_Point_x0020_of_x00;
            series.Details = d.Details_x0020_of_x0020_Strategy;
            series.Date = d.Date_x0020_of_x0020_Agency_x0020;
            series.Initiative = d.OMB_x0020_Initiatives;
            if (series.Initiative == 'Software License Management') {
                series.Initiative = 'Soft. Lic. Mngmt.';
            }
            series.ITServiceType = d.Commodity_x0020_IT_x0020_Categor;
            series.AmountType = d.AmountType;
            series.Author = d.Author.Title;
            series.RelatedUIIs = d.Related_x0020_Investment_x0020_U || '';
            series.Description = d.Use_x0020_of_x0020_Savings_x002f0;
            series.dd = moment(series.Date)._d; // dc.js round months to beginning of month
            series.month = d3.time.month(series.dd); // pre-calculate timing for better performance
            series.Year = +('20' + i);
            if (series.Year == 2017) {
                series.RealizedAvoidance = +d['RealizedAvoidanceQ120' + i] * 1000000 || 0;
                series.RealizedSavings = +d['RealizedSavingsQ120' + i] * 1000000 || 0;
                series.Realized = +(series.RealizedAvoidance + series.RealizedSavings);
            } else {
                series.RealizedAvoidance = +d['RealizedAvoidance20' + i] * 1000000 || 0;
                series.RealizedSavings = +d['RealizedSavings20' + i] * 1000000 || 0;
                series.Realized = +(series.RealizedAvoidance + series.RealizedSavings);
            }
            if (series.Year > 2016) {
                series.ProjectedAvoidance = +d['ProjectedAvoidance20' + i] * 1000000 || 0;
                series.ProjectedSavings = +d['ProjectedSavings20' + i] * 1000000 || 0;
                series.Projected = +(series.ProjectedAvoidance + series.ProjectedSavings);
            } else {
                series.ProjectedAvoidance = 0;
                series.ProjectedSavings = 0;
                series.Projected = +(series.ProjectedAvoidance + series.ProjectedSavings);
            }
            series.ImplementationCosts = +d['ImplementationCosts20' + i] * 1000000 || 0;
            series.Sum = d['NetOrGross20' + i];
            results.push(series);
            if (years.indexOf(series.Year) < 0) {
                years.push(series.Year);
            }

        }
    });

        
    years.sort();

    // set crossfilter
    let ndx = crossfilter(results);

    // define dimensions
    var
        componentDim = ndx.dimension(function(d) {
            return d.Component;
        }),
        timeDim = ndx.dimension(function(d) {
            return d.Year;
        }),
        yearDim = ndx.dimension(function(d) {
            return d.Year;
        }),
        initiativeDim = ndx.dimension(function(d) {
            return d.Initiative;
        }),
        serviceTypeDim = ndx.dimension(function(d) {
            return d.ITServiceType;
        }),
        tableDim = ndx.dimension(function(d) {
            return d.Id;
        });

    // group dimensions
    var all = ndx.groupAll(),
        amountByComponent = componentDim.group().reduceSum(function(d) {
            return Math.round(d.Realized);
        }),
        amountByProjected = yearDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.Projected) || 0;
                p.realized += Math.round(v.Realized) || 0;
                p.total += Math.round(p.amount + p.realized);
                
                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.Projected) || 0;
                p.realized -= Math.round(v.Realized) || 0;
                p.total -= Math.round(p.amount + p.realized);

                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0,
                    realized: 0,
                    total: 0,
                    percent: 0
                };
            }
        ),
        amountByRealized = yearDim.group().reduce(
            function(p, v) {
                ++p.count;
                p.amount += Math.round(v.Realized) || 0;
                p.projected += Math.round(v.Projected) || 0;
                p.total += Math.round(p.amount + p.projected);

                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function(p, v) {
                --p.count;
                p.amount -= Math.round(v.Realized) || 0;
                p.projected -= Math.round(v.Projected) || 0;
                p.total -= Math.round(p.amount + p.projected);

                p.percent = p.total === 0 ? 0 : +p.amount / p.total;
                return p;
            },
            function() {
                return {
                    count: 0,
                    amount: 0,
                    projected: 0,
                    total: 0,
                    percent: 0
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
            return Math.round(d.Realized);
        });
        
    // dc.js charts
    let select = dc.selectMenu('#components');
    let stackedChart = dc.barChart("#chart-realized");
    let groupedChart = dc.barChart("#chart-projected");
    let initiativesChart = dc.pieChart("#chart-initiatives");
    let serviceTypesChart = dc.rowChart('#chart-serviceTypes');
    let dataTable = dc.dataTable('#data-table');

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
        .group(amountByProjected, "Projected")
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
        .radius(d3.min([ringChartWidth, ringChartHeight]) / 2)
        .externalLabels(d3.min([ringChartWidth, ringChartHeight]) / 8)
        .externalRadiusPadding(d3.min([ringChartWidth, ringChartHeight]) / 8)
        .dimension(initiativeDim)
        .group(amountByInitiative)
        .ordinalColors(colorbrewer.PuOr[6])
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .drawPaths(false)
        // .legend(dc.legend().y(0))
        // .label(function(d) {
        //     if (initiativesChart.hasFilter() && !initiativesChart.hasFilter(d.key)) {
        //         return '0%';
        //     }
        //     let label = '';
        //     if (all.value()) {
        //         // label += ' (' + Math.round(d.value.amount / totalAmount.value() * 100) + '%)';
        //         d.value.percent = d.value.amount / totalAmount.value();
        //         label += perFormat(d.value.percent);
        //     }
        //     return label;
        // })
        .renderTitle(false)
        .innerRadius(d3.min([ringChartWidth, ringChartHeight]) / 5);

    initiativesChart.on('pretransition',function(chart) {
        setResponsiveSVG(chart);
    });

    dc.override(initiativesChart, 'legendables', function() {
        let items = initiativesChart._legendables();
        return items.reverse();
    }); // reverse order of legend items


    serviceTypesChart
        .width(rowChartWidth)
        .height(rowChartHeight)
        .dimension(serviceTypeDim)
        .group(amountByServiceType)
        .ordinalColors(colorbrewer.PuOr[9])
        .valueAccessor(function(d) {
            return d.value.amount;
        })
        .label(function(d) {
            if (serviceTypesChart.hasFilter() && !serviceTypesChart.hasFilter(d.key)) {
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
        // .rowsCap(10)
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
        
    let sortColumn = 0;
    let displayCols = 0;
    let numericCol = 0;
    let tableHTML = '<thead><tr>';
    for (let i = 0; i < columns.length; i++) {
        let display = '';
        let classed = '';
        if (columns[i].type =="double" && !numericCol > 0) {
            numericCol = i+1;
        }
        if (!columns[i].display) {
            displayCols++;
            display = 'display:none;';
        }
        if (columns[i].sort) {
            sortColumn = i;
            classed = 'sorting_asc';
        }
        else {
            classed = 'sorting';
        }

        tableHTML += "<th class='" + classed + "' rowspan='1' colspan='1' style='" + display + "' data-col='" + columns[i].field + "'>" + columns[i].label + "</th>";
    }

    tableHTML += "</tr></thead>";

    $('.dc-data-tables_scrollHeadInner > table').append(tableHTML);

    dataTable
        .width(tableWidth)
        .height(tableHeight)
        .dimension(tableDim)
        .group(function(d) {
            return d;
        })
        .showGroups(false)
        .columns(columns)
        .sortBy(function(d) {
            return d[columns[sortColumn].field];
        })
        .size(Infinity)
        .order(d3.ascending)
        .on('renderlet', function(table) {
            $('th:nth-child(-n+'+displayCols+')').not('th:nth-child(' + sortColumn + ')').css('display', 'none'); // hide header column; assumes columns array groups invisible columns together
            $('td:nth-child(-n+'+displayCols+')').not('th:nth-child(' + sortColumn + ')').css('display', 'none'); // hide header column; assumes columns array groups invisible columns together
            $('td:nth-child(n+'+numericCol+')').css('text-align', 'right'); // right align numerical data; assumes columns array groups double data type columns together

            /**
             * Adapted from Datatables jquery.dataTables.js:5169-5436
             * Update the header, footer and body tables for resizing - i.e. column
             * alignment.
             *
             * Welcome to the most horrible function DataTables. The process that this
             * function follows is basically:
             *   1. Re-create the table inside the scrolling div
             *   2. Take live measurements from the DOM
             *   3. Apply the measurements to align the columns
             *   4. Clean up            
             */
            function _fnScrollDraw() {

                /**
                 * Get an array of column indexes that match a given property
                 *  @param {object} oSettings dataTables settings object
                 *  @param {string} sParam Parameter in aoColumns to look for - typically
                 *    bVisible or bSearchable
                 *  @returns {array} Array of indexes with matched properties
                 *  @memberof DataTable#oApi
                 */
                function _fnGetColumns(oSettings, sParam) {
                    let a = [];

                    $.map(oSettings.aoColumns, function(val, i) {
                        if (val[sParam]) {
                            a.push(i);
                        }
                    });

                    return a;
                }

                /**
                 * Covert the index of a visible column to the index in the data array (take account
                 * of hidden columns)
                 *  @param {object} oSettings dataTables settings object
                 *  @param {int} iMatch Visible column index to lookup
                 *  @returns {int} i the data index
                 *  @memberof DataTable#oApi
                 */
                function _fnVisibconstoColumnIndex(oSettings, iMatch) {
                    let aiVis = _fnGetColumns(oSettings, 'bVisible');

                    return typeof aiVis[iMatch] === 'number' ?
                        aiVis[iMatch] :
                        null;
                }

                /**
                 * Use the DOM source to create up an array of header cells. The idea here is to
                 * create a layout grid (array) of rows x columns, which contains a reference
                 * to the cell that that point in the grid (regardless of col/rowspan), such that
                 * any column / row could be removed and the new grid constructed
                 *  @param array {object} aLayout Array to store the calculated layout in
                 *  @param {node} nThead The header/footer element for the table
                 *  @memberof DataTable#oApi
                 */
                function _fnDetectHeader(aLayout, nThead) {
                    let nTrs = $(nThead).children('tr');
                    let nTr, nCell;
                    let i, k, l, iLen, jLen, iColShifted, iColumn, iColspan, iRowspan;
                    let bUnique;
                    let fnShiftCol = function(a, i, j) {
                        let k = a[i];
                        while (k[j]) {
                            j++;
                        }
                        return j;
                    };

                    aLayout.splice(0, aLayout.length);

                    /* We know how many rows there are in the layout - so prep it */
                    for (i = 0, iLen = nTrs.length; i < iLen; i++) {
                        aLayout.push([]);
                    }

                    /* Calculate a layout array */
                    for (i = 0, iLen = nTrs.length; i < iLen; i++) {
                        nTr = nTrs[i];
                        iColumn = 0;

                        /* For every cell in the row... */
                        nCell = nTr.firstChild;
                        while (nCell) {
                            if (nCell.nodeName.toUpperCase() == "TD" ||
                                nCell.nodeName.toUpperCase() == "TH") {
                                /* Get the col and rowspan attributes from the DOM and sanitise them */
                                iColspan = nCell.getAttribute('colspan') * 1;
                                iRowspan = nCell.getAttribute('rowspan') * 1;
                                iColspan = (!iColspan || iColspan === 0 || iColspan === 1) ? 1 : iColspan;
                                iRowspan = (!iRowspan || iRowspan === 0 || iRowspan === 1) ? 1 : iRowspan;

                                /* There might be colspan cells already in this row, so shift our target
                                 * accordingly
                                 */
                                iColShifted = fnShiftCol(aLayout, i, iColumn);

                                /* Cache calculation for unique columns */
                                bUnique = iColspan === 1 ? true : false;

                                /* If there is col / rowspan, copy the information into the layout grid */
                                for (l = 0; l < iColspan; l++) {
                                    for (k = 0; k < iRowspan; k++) {
                                        aLayout[i + k][iColShifted + l] = {
                                            "cell": nCell,
                                            "unique": bUnique
                                        };
                                        aLayout[i + k].nTr = nTr;
                                    }
                                }
                            }
                            nCell = nCell.nextSibling;
                        }
                    }
                }

                /**
                 * Get an array of unique th elements, one for each column
                 *  @param {object} oSettings dataTables settings object
                 *  @param {node} nHeader automatically detect the layout from this node - optional
                 *  @param {array} aLayout thead/tfoot layout from _fnDetectHeader - optional
                 *  @returns array {node} aReturn list of unique th's
                 *  @memberof DataTable#oApi
                 */
                function _fnGetUniqueThs(oSettings, nHeader, aLayout) {
                    let aReturn = [];
                    if (!aLayout) {
                        aLayout = oSettings.aoHeader;
                        if (nHeader) {
                            aLayout = [];
                            _fnDetectHeader(aLayout, nHeader);
                        }
                    }

                    for (let i = 0, iLen = aLayout.length; i < iLen; i++) {
                        for (let j = 0, jLen = aLayout[i].length; j < jLen; j++) {
                            if (aLayout[i][j].unique &&
                                (!aReturn[j] || !oSettings.bSortCellsTop)) {
                                aReturn[j] = aLayout[i][j].cell;
                            }
                        }
                    }

                    return aReturn;
                }

                /**
                 * Apply a given function to the display child nodes of an element array (typically
                 * TD children of TR rows
                 *  @param {function} fn Method to apply to the objects
                 *  @param array {nodes} an1 List of elements to look through for display children
                 *  @param array {nodes} an2 Another list (identical structure to the first) - optional
                 *  @memberof DataTable#oApi
                 */
                function _fnApplyToChildren(fn, an1, an2) {
                    let index = 0,
                        i = 0,
                        iLen = an1.length;
                    let nNode1, nNode2;

                    while (i < iLen) {
                        nNode1 = an1[i].firstChild;
                        nNode2 = an2 ? an2[i].firstChild : null;

                        while (nNode1) {
                            if (nNode1.nodeType === 1) {
                                if (an2) {
                                    fn(nNode1, nNode2, index);
                                }
                                else {
                                    fn(nNode1, index);
                                }

                                index++;
                            }

                            nNode1 = nNode1.nextSibling;
                            nNode2 = an2 ? nNode2.nextSibling : null;
                        }

                        i++;
                    }
                }

                /**
                 * Append a CSS unit (only if required) to a string
                 *  @param {string} value to css-ify
                 *  @returns {string} value with css unit
                 *  @memberof DataTable#oApi
                 */
                function _fnStringToCss(s) {
                    if (s === null) {
                        return '0px';
                    }

                    if (typeof s == 'number') {
                        return s < 0 ?
                            '0px' :
                            s + 'px';
                    }

                    // Check it has a unit character already
                    return s.match(/\d$/) ?
                        s + 'px' :
                        s;
                }

                var
                    scroll = {
                        "bCollapse": true,
                        "iBarWidth": 17,
                        "sX": "",
                        "sXInner": "",
                        "sY": tableHeight + "px"
                    }, // set this programmatically
                    scrollX = scroll.sX,
                    scrollXInner = scroll.sXInner,
                    scrollY = scroll.sY,
                    barWidth = scroll.iBarWidth,
                    divHeader = $('div.dc-data-tables_scrollHead'),
                    divHeaderStyle = divHeader[0].style,
                    divHeaderInner = divHeader.children('div'),
                    divHeaderInnerStyle = divHeaderInner[0].style,
                    divHeaderTable = divHeaderInner.children('table'),
                    divBodyEl = $('div.dc-data-tables_scrollBody')[0],
                    divBody = $(divBodyEl),
                    divBodyStyle = divBodyEl.style,
                    divFooter = $('div.dc-data-tables_scrollFoot'),
                    divFooterInner = divFooter.children('div'),
                    divFooterTable = divFooterInner.children('table'),
                    header = $('div.dc-data-tables_scrollHead thead'),
                    dataTable = $('div.dc-data-tables_scrollBody table'),
                    tableEl = dataTable[0],
                    tableStyle = tableEl.style,
                    footer = $('div.dc-data-tables_scrollFoot tfoot'),
                    browser = {
                        "bScrollOversize": false,
                        "bScrollbarLeft": false,
                        "bBounding": true,
                        "barWidth": 17
                    }, // set this programmatically
                    ie67 = browser.bScrollOversize,
                    dtHeaderCells = [],
                    headerTrgEls, footerTrgEls,
                    headerSrcEls, footerSrcEls,
                    headerCopy, footerCopy,
                    headerWidths = [],
                    footerWidths = [],
                    headerContent = [],
                    footerContent = [],
                    idx, correction, sanityWidth,
                    zeroOut = function(nSizer) {
                        let style = nSizer.style;
                        style.paddingTop = "0";
                        style.paddingBottom = "0";
                        style.borderTopWidth = "0";
                        style.borderBottomWidth = "0";
                        style.height = 0;
                    };

                $('div.dc-data-tables_scrollHead table thead th').each(function() {
                    dtHeaderCells.push(this);
                })

                // If the scrollbar visibility has changed from the last draw, we need to
                // adjust the column sizes as the table width will have changed to account
                // for the scrollbar
                let scrollBarVis = divBodyEl.scrollHeight > divBodyEl.clientHeight;

                // if ( settings.scrollBarVis !== scrollBarVis && settings.scrollBarVis !== undefined ) {
                // 	settings.scrollBarVis = scrollBarVis;
                // 	_fnAdjustColumnSizing( settings );
                // 	return; // adjust column sizing will call this function again
                // }
                // else {
                // 	settings.scrollBarVis = scrollBarVis;
                // }

                /*
                 * 1. Re-create the table inside the scrolling div
                 */

                // Remove the old minimised thead and tfoot elements in the inner table
                dataTable.children('thead, tfoot').remove();

                if (footer) {
                    footerCopy = footer.clone().prependTo(dataTable);
                    footerTrgEls = footer.find('tr'); // the original tfoot is in its own table and must be sized
                    footerSrcEls = footerCopy.find('tr');
                }

                // Clone the current header and footer elements and then place it into the inner table
                headerCopy = header.clone().prependTo(dataTable);
                headerTrgEls = header.find('tr'); // original header is in its own table
                headerSrcEls = headerCopy.find('tr');
                headerCopy.find('th, td').removeAttr('tabindex');

                /*
                 * 2. Take live measurements from the DOM - do not alter the DOM itself!
                 */

                // Remove old sizing and apply the calculated column widths
                // Get the unique column headers in the newly created (cloned) header. We want to apply the
                // calculated sizes to this header
                if (!scrollX) {
                    divBodyStyle.width = '100%';
                    divHeader[0].style.width = '100%';
                }

                $.each(headerCopy, function(i, el) {
                    // 			let idx = _fnVisibconstoColumnIndex( settings, i ); // function to determine if the columns has a width of greater than zero
                    idx = i;
                    // 			el.style.width = settings.aoColumns[idx].sWidth;
                    el.style.width = el.style.width;
                });

                if (footer) {
                    _fnApplyToChildren(function(n) {
                        n.style.width = "";
                    }, footerSrcEls);
                }

                // Size the table as a whole
                sanityWidth = dataTable.outerWidth();
                if (scrollX === "") {
                    // No x scrolling
                    tableStyle.width = "100%";

                    // IE7 will make the width of the table when 100% include the scrollbar
                    // - which is shouldn't. When there is a scrollbar we need to take this
                    // into account.
                    if (ie67 && (dataTable.find('tbody').height() > divBodyEl.offsetHeight ||
                            divBody.css('overflow-y') == "scroll")) {
                        tableStyle.width = _fnStringToCss(dataTable.outerWidth() - barWidth);
                    }

                    // Recalculate the sanity width
                    sanityWidth = dataTable.outerWidth();
                }
                else if (scrollXInner !== "") {
                    // legacy x scroll inner has been given - use it
                    tableStyle.width = _fnStringToCss(scrollXInner);

                    // Recalculate the sanity width
                    sanityWidth = dataTable.outerWidth();
                }

                // Hidden header should have zero height, so remove padding and borders. Then
                // set the width based on the real headers

                // Apply all styles in one pass
                _fnApplyToChildren(zeroOut, headerSrcEls);

                // Read all widths in next pass
                _fnApplyToChildren(function(nSizer) {
                    headerContent.push(nSizer.innerHTML);
                    headerWidths.push(_fnStringToCss($(nSizer).css('width')));
                }, headerSrcEls);

                // Apply all widths in final pass
                _fnApplyToChildren(function(nToSize, i) {
                    // Only apply widths to the DataTables detected header cells - this
                    // prevents complex headers from having contradictory sizes applied
                    if ($.inArray(nToSize, dtHeaderCells) !== -1) {
                        nToSize.style.width = headerWidths[i];
                    }
                }, headerTrgEls);

                $(headerSrcEls).height(0);

                /* Same again with the footer if we have one */
                if (footer) {
                    _fnApplyToChildren(zeroOut, footerSrcEls);

                    _fnApplyToChildren(function(nSizer) {
                        footerContent.push(nSizer.innerHTML);
                        footerWidths.push(_fnStringToCss($(nSizer).css('width')));
                    }, footerSrcEls);

                    _fnApplyToChildren(function(nToSize, i) {
                        nToSize.style.width = footerWidths[i];
                    }, footerTrgEls);

                    $(footerSrcEls).height(0);
                }

                /*
                 * 3. Apply the measurements
                 */

                // "Hide" the header and footer that we used for the sizing. We need to keep
                // the content of the cell so that the width applied to the header and body
                // both match, but we want to hide it compconstely. We want to also fix their
                // width to what they currently are
                _fnApplyToChildren(function(nSizer, i) {
                    nSizer.innerHTML = '<div class="dataTables_sizing" style="height:0;overflow:hidden;">' + headerContent[i] + '</div>';
                    nSizer.style.width = headerWidths[i];
                }, headerSrcEls);

                if (footer) {
                    _fnApplyToChildren(function(nSizer, i) {
                        nSizer.innerHTML = '<div class="dataTables_sizing" style="height:0;overflow:hidden;">' + footerContent[i] + '</div>';
                        nSizer.style.width = footerWidths[i];
                    }, footerSrcEls);
                }

                // Sanity check that the table is of a sensible width. If not then we are going to get
                // misalignment - try to prevent this by not allowing the table to shrink below its min width
                if (dataTable.outerWidth() < sanityWidth) {
                    // The min width depends upon if we have a vertical scrollbar visible or not */
                    correction = ((divBodyEl.scrollHeight > divBodyEl.offsetHeight ||
                            divBody.css('overflow-y') == "scroll")) ?
                        sanityWidth + barWidth :
                        sanityWidth;

                    // IE6/7 are a law unto themselves...
                    if (ie67 && (divBodyEl.scrollHeight >
                            divBodyEl.offsetHeight || divBody.css('overflow-y') == "scroll")) {
                        tableStyle.width = _fnStringToCss(correction - barWidth);
                    }

                }
                else {
                    correction = '100%';
                }

                // Apply to the container elements
                divBodyStyle.width = _fnStringToCss(correction);
                divHeaderStyle.width = _fnStringToCss(correction);

                /*
                 * 4. Clean up
                 */
                if (!scrollY) {
                    /* IE7< puts a vertical scrollbar in place (when it shouldn't be) due to subtracting
                     * the scrollbar height from the visible display, rather than adding it on. We need to
                     * set the height in order to sort this. Don't want to do it in any other browsers.
                     */
                    if (ie67) {
                        divBodyStyle.height = _fnStringToCss(tableEl.offsetHeight + barWidth);
                    }
                }

                /* Finally set the width's of the header and footer tables */
                let iOuterWidth = dataTable.outerWidth();
                divHeaderTable[0].style.width = _fnStringToCss(iOuterWidth);
                divHeaderInnerStyle.width = _fnStringToCss(iOuterWidth);

                // Figure out if there are scrollbar present - if so then we need a the header and footer to
                // provide a bit more space to allow "overflow" scrolling (i.e. past the scrollbar)
                let bScrolling = dataTable.height() > divBodyEl.clientHeight || divBody.css('overflow-y') == "scroll";
                let padding = 'padding' + (browser.bScrollbarLeft ? 'Left' : 'Right');
                divHeaderInnerStyle[padding] = bScrolling ? barWidth + "px" : "0px";

                // Correct DOM ordering for colgroup - comes before the thead
                dataTable.children('colgroup').insertBefore(dataTable.children('thead'));

                /* Adjust the position of the header in case we loose the y-scrollbar */
                divBody.scroll();

                // If sorting or filtering has occurred, jump the scrolling back to the top
                // only if we aren't holding the position
                // 		if ( (settings.bSorted || settings.bFiltered) && ! settings._drawHold ) {
                // 			divBodyEl.scrollTop = 0;
                // 		}
            }
            _fnScrollDraw();
        });

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
            } else if (e.target.nodeName == 'rect' && e.target.classList.contains('bar') && $(e.target).closest('div')[0].id == 'chart-realized') {
                let d = d3.select(e.target).data()[0];
                let key = d.layer;
                let percent = perFormat(d.data.value.percent);
                let amount = currFormat(d.data.value.amount);
                showDetail(e, key, amount, null, percent)
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
    d3.select('#dateHeader').text(formatDate(new Date()));

    // enable sort on data table
    $('.dc-data-tables_scrollHead table > thead > tr').on('click', 'th', function() {
        // http://stackoverflow.com/questions/21113513/reorder-datatable-by-column#answer-30946896
        let header = $(this);
        let column = header.attr("data-col");
        // JavaScript and jQuery by Jon Duckett, pp.560 - 565
        if (header.is('.sorting_asc') || header.is('.sorting_desc')) {
            header.toggleClass('sorting_asc sorting_desc');
        }
        else {
            header.addClass('sorting_asc').removeClass('sorting');
            header.siblings().removeClass('sorting_asc sorting_desc');
            header.siblings().addClass('sorting');
        }

        let sortOrder;
        if (!header.hasClass('sorting_asc')) {
            sortOrder = d3.descending;
        }
        else {
            sortOrder = d3.ascending;
        }

        tableDim.dispose();
        tableDim = ndx.dimension(function(d) {
            return d[column];
        });
        dataTable
            .dimension(tableDim)
            .sortBy(function(d) {
                return d[column];
            })
            .size(Infinity)
            .order(sortOrder);
        dataTable.redraw();
    });

    // add selected item information as table in modal
    $('#data-table').on('click', 'tbody tr a', function(event) {
        let thisTable = d3.select($(this).closest('table')[0]);
        let thisRow = d3.select($(this).closest('tr')[0]);
        let cells = thisRow.selectAll('td')[0].map(function(d) {
            let text;
            if (d.firstChild !== undefined && d.firstChild.textContent !== undefined) {
                text = d.firstChild.textContent;
            }
            else {
                text = d.textContent;
            }
            return text;
        });
        let headers = thisTable.selectAll('thead th')[0].map(function(d) {
            return d.textContent;
        });
        let data = headers.map(function(d, i) {
            let obj = {};
            obj.key = d;
            obj.value = cells[i];
            return obj;
        });

        $('#tableDiv table').remove();
        let table = d3.select('#tableDiv').append('table').attr({
            'id': 'modal-table',
            'class': 'table table-bordered table-condensed'
        }).style({
            'width': '100%',
            'table-layout': 'fixed'
        });
        let tbody = table.append('tbody');

        let rows = tbody.selectAll('tr')
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
        let width = +chart.select('svg').attr('width');
        let height = +chart.select('svg').attr('height');
        let calcString = +(height / width) * 100 + "%";

        let svgElement = chart.select('svg');
        let svgParent = d3.select(chart.select('svg').node().parentNode);
        
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

    let test = '';
    let siteUrl = '';
    let cols = [];
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

    cols = "Id,StrategyID,Title,Component_x0020_Name,Details_x0020_of_x0020_Strategy,Primary_x0020_Point_x0020_of_x00,Details_x0020_of_x0020_Strategy,Date_x0020_of_x0020_Agency_x0020,OMB_x0020_Initiatives,Commodity_x0020_IT_x0020_Categor,AmountType,Related_x0020_Investment_x0020_U,Use_x0020_of_x0020_Savings_x002f0,ProjectedAvoidance2014,ProjectedAvoidance2015,ProjectedAvoidance2016,ProjectedAvoidance2017,ProjectedAvoidance2018,ProjectedAvoidance2019,ProjectedSavings2014,ProjectedSavings2015,ProjectedSavings2016,ProjectedSavings2017,ProjectedSavings2018,ProjectedSavings2019,RealizedAvoidance2012,RealizedAvoidance2013,RealizedAvoidance2014,RealizedAvoidance2015,RealizedAvoidance2016,RealizedAvoidanceQ12017,RealizedAvoidance2018,RealizedSavings2012,RealizedSavings2013,RealizedSavings2014,RealizedSavings2015,RealizedSavings2016,RealizedSavingsQ12017,RealizedSavings2018,ImplementationCosts2012,ImplementationCosts2013,ImplementationCosts2014,ImplementationCosts2015,ImplementationCosts2016,ImplementationCosts2017,ImplementationCosts2018,ImplementationCosts2019,NetOrGross2012,NetOrGross2013,NetOrGross2014,NetOrGross2015,NetOrGross2016,NetOrGross2017,NetOrGross2018,NetOrGross2019,Author/Title";
    //for (let i = 0;i<columns.length;i++) {
    //    cols.push(columns[i].field);
    //}
    expand = "Author";
    filter = "";
    top = 200;

    let componentEndpoint = callData('https://itim.doj.gov/DOJCS','list','CSA Initiatives',cols,expand,filter,top);

    // Get the data
    componentEndpoint.get(function(error, data) {
        createViz(error, data);
    });

}

getData();