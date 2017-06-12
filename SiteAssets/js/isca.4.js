let width;
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

(function() {
    "use strict";

    // define data
    const columns = [{
        "label": "Investment Number",
        "field": "Investment%5Fx0020%5FNumber",
        "format": function(d) {
            return d['Investment Number'];
        },
        "type": "string",
        "display": false,
        "sort": false
    }, {
        "label": "Year",
        "field": "Year",
        "format": function(d) {
            return d.Year;
        },
        "type": "integer",
        "display": false,
        "sort": false
    }, {
        "label": "Component",
        "field": "Component",
        "format": function(d) {
            return d.Component;
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Investment Name",
        "field": "Investment%5Fx0020%5FName",
        "format": function(d) {
            return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + d['InvestmentName'] + "</a>";
        },
        "type": "string",
        "display": true,
        "sort": true
    }, {
        "label": "Service",
        "field": "Title",
        "format": function(d) {
            return d.Service;
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Category",
        "field": "Category",
        "format": function(d) {
            return d.Category;
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Business Area",
        "field": "Business%5Fx0020%5FArea",
        "format": function(d) {
            return d['Business Area'];
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Total",
        "field": "Value",
        "format": function(d) {
            return currFormat(+d.Value);
        },
        "type": "double",
        "display": true,
        "sort": false
    }];

    // trigger loader
    let spinner = new Spinner(opts).spin(target);

    // dimensions for the charts
    let dashboardHeight = getSize().height;
    let headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
    let footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

    let sankeyHeaderHeight = document.querySelector('#sankey header').offsetHeight;
    let sankeyFooterHeight = document.querySelector('#sankey footer').offsetHeight;
    let height = (dashboardHeight - headerHeight - footerHeight - sankeyHeaderHeight - sankeyFooterHeight) * 8 / 9;

    width = document.querySelector('#sankey footer').offsetWidth - 16;

    let margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };

    // Return only 1 - p quantile to reduce possibility of overlapping text
    // Define p as an arbitrary number between [0,1]
    let p = 0.8;

    // Define the hierarchical categories of the sankey
    let steps = ["Business Area", "Category", "Service"];

    // append the svg canvas to the page
    let svg = d3.select("#component").append("svg")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margins.left + "," + (+margins.top) + ")");

    // Set the sankey diagram properties
    let sankey = d3.sankey()
        .nodeWidth(12)
        .nodePadding(2)
        .size([width, height]);

    let path = sankey.link();

    // create rect elements to store category labels
    let bars = svg.selectAll('.label')
        .data(steps, (d, i) => {
            return i;
        });

    // Enter
    bars
        .enter()
        .append('g')
        .attr('class', 'label');

    // Enter + Update
    bars
        .append('rect')
        .attr('class', 'bar')
        .attr('height', (d) => {
            return height;
        })
        .attr('width', (d, i) => {
            return width / steps.length;
        })
        .attr('x', (d, i) => {
            return width / steps.length * i;
        })
        .style('fill', 'white');

    bars
        .append("text")
        .attr("dy", ".35em")
        .attr("transform", null)
        .attr('y', -margins.top + 6) // 6 seems to be a good number for font size
        .attr('x', (d, i) => {
            return width / steps.length * i + (width / steps.length) / 2;
        })
        .attr("text-anchor", "middle")
        .style('font-weight', 'bold')
        .text((d) => {
            return d;
        });


    // define the links group
    let linksGroup = svg.append("g");

    // define the node group
    let nodesGroup = svg.append("g");

    // load the data
    function createViz(error, data) {

        // patterned after Customized Paraset
        // http://bl.ocks.org/mydu/67692343b28ea5069177


        // TODO: implement a renderSandkey function with enter and exit pattern
        // https://bl.ocks.org/austinczarnecki/cc6371af0b726e61b9ab

        if (error) throw error;

        // stop spin.js loader
        spinner.stop();

        // process data
        let results = data.value.map((d) => {
            d.Year = d.Year.toString();
            d.Value = d.Value * 1000;
            return d;
        });

        // set sankey graph
        let graph = transformToGraph(results);

        // set crossfilter
        let ndx = crossfilter(results);

        // define dimensions
        var
            componentDim = ndx.dimension((d) => {
                return d.Component;
            }),
            yearDim = ndx.dimension((d) => {
                return d.Year;
            }),
            businessDim = ndx.dimension((d) => {
                return d['Business Area'];
            }),
            categoryDim = ndx.dimension((d) => {
                return d.Category;
            });

        // group dimensions
        var
            amountByComponent = componentDim.group().reduceSum((d) => {
                return Math.round(+d.Value);
            }),
            amountByyear = yearDim.group().reduceSum((d) => {
                return Math.round(+d.Value);
            }),
            amountByBusinessArea = businessDim.group().reduceSum((d) => {
                return Math.round(+d.Value);
            }),
            amountByCategory = categoryDim.group().reduceSum((d) => {
                return Math.round(+d.Value);
            });

        // dc.js chart types
        let componentSelect = dc.selectMenu('#components');
        let yearSelect = dc.selectMenu('#years');
        let businessSelect = dc.selectMenu('#businessAreas');
        let categorySelect = dc.selectMenu('#categories');

        // menuselect
        componentSelect
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
            .title((d) => {
                return d.key;
            })
            .promptText('All Components')
            .promptValue(null);

        componentSelect.on('pretransition', (chart) => {
            // add styling to select input
            d3.select('#components').classed('dc-chart', false);
            chart.select('select').classed('w3-form', true);
        });

        componentSelect.on('filtered', (chart, filter) => {
            let datum = transformToGraph(componentDim.top(Infinity));
            renderSankey(datum);
            bindHover();
        });

        // menuselect
        yearSelect
            .dimension(yearDim)
            .group(amountByyear)
            // .filterDisplayed(function () {
            //     return true;
            // })
            .multiple(false)
            .numberVisible(null)
            // .order(function (a,b) {
            //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
            // })
            .title((d) => {
                return d.key;
            })
            .promptText('All Years')
            .promptValue(null);

        yearSelect.on('pretransition', (chart) => {
            // add styling to select input
            d3.select('#years').classed('dc-chart', false);
            chart.select('select').classed('w3-form', true);
        });

        yearSelect.on('filtered', (chart, filter) => {
            let datum = transformToGraph(yearDim.top(Infinity));
            renderSankey(datum);
            bindHover();
        });

        // menuselect
        categorySelect
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
            .title((d) => {
                return d.key;
            })
            .promptText('All Categories')
            .promptValue(null);

        categorySelect.on('pretransition', (chart) => {
            // add styling to select input
            d3.select('#categories').classed('dc-chart', false);
            chart.select('select').classed('w3-form', true);
        });

        categorySelect.on('filtered', (chart, filter) => {
            let datum = transformToGraph(categoryDim.top(Infinity));
            renderSankey(datum);
            bindHover();
        });

        // menuselect
        businessSelect
            .dimension(businessDim)
            .group(amountByBusinessArea)
            // .filterDisplayed(function () {
            //     return true;
            // })
            .multiple(false)
            .numberVisible(null)
            // .order(function (a,b) {
            //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
            // })
            .title((d) => {
                return d.key;
            })
            .promptText('All Business Areas')
            .promptValue(null);

        businessSelect.on('pretransition', (chart) => {
            // add styling to select input
            d3.select('#businessAreas').classed('dc-chart', false);
            chart.select('select').classed('w3-form', true);
        });

        businessSelect.on('filtered', (chart, filter) => {
            let datum = transformToGraph(businessDim.top(Infinity));
            renderSankey(datum);
            bindHover();
        });

        dc.renderAll();

        renderSankey(graph);

        // define mouseover and mouseout events
        function bindHover() {
            document.body.addEventListener('mousemove', function(e) {
                if (e.target.classList.contains('link')) {
                    var d = d3.select(e.target).data()[0];
                    let key = d.source.name + " → " + d.target.name;
                    let amount = formatAbbreviation(d.value);
                    showDetail(e, key, amount, null, null)
                } else if (e.target.nodeName == ('rect') && !e.target.classList.contains('bar')) {
                    var d = d3.select(e.target).data()[0];
                    let key = d.name;
                    let amount = formatAbbreviation(d.value);
                    showDetail(e, key, amount, null, null)
                }
            });

            document.body.addEventListener('mouseout', function(e) {
                if (e.target.classList.contains('link') || e.target.nodeName == ('rect')) hideDetail();
            });
        }

        bindHover();

        // Change the date header to reflect the date and time of the data
        d3.select('#dateHeader').text(formatDate(new Date()));

        setResponsiveSVG(d3);

    }

    // transform JSON data array into sankey graph object with nodes and links arrays
    // inspired by DensityDesign Lab raw.js functions by Giorgio Caviglia, Michele Mauri, Giorgio Uboldi, Matteo Azzi
    // http://app.rawgraphs.io/
    function transformToGraph(data) {

        let d = {
            nodes: [],
            links: []
        };

        if (!steps || steps.length < 2) return d;

        let n = [],
            l = [],
            si, ti;

        for (let i = 0; i < steps.length - 1; i++) {

            let sg = steps[i];
            let tg = steps[i + 1];
            let relations = d3.nest()
                .key((d) => {
                    return d[sg];
                })
                .key((d) => {
                    return d[tg];
                })
                .entries(data);

            relations.forEach((s) => {
                si = getNodeIndex(n, s.key, sg);

                if (si == -1) {
                    n.push({
                        name: s.key,
                        group: sg
                    });
                    si = n.length - 1;
                }

                s.values.forEach((t) => {
                    ti = getNodeIndex(n, t.key, tg);
                    if (ti == -1) {
                        n.push({
                            name: t.key,
                            group: tg
                        });
                        ti = n.length - 1;
                    }
                    let value = d3.sum(t.values, (d) => {
                        return d.Value;
                    });
                    let link = {
                        source: n[si],
                        target: n[ti],
                        value: value
                    };
                    l.push(link);
                });
            });
        }
        d.nodes = n.sort(customSort);
        l.forEach((d) => {
            d.source = n.indexOf(d.source);
            d.target = n.indexOf(d.target);
        });
        d.links = l;

        function customSort(a, b) {
            let Item1 = a.group;
            let Item2 = b.group;
            if (Item1 != Item2) {
                return (Item1.localeCompare(Item2));
            }
            else {
                return (a.name.localeCompare(b.name));
            }
        }

        function getNodeIndex(array, name, group) {
            for (let i in array) {
                let a = array[i];
                if (a['name'] == name && a['group'] == group) {
                    return i;
                }
            }
            return -1;
        }

        return d;

    }

    function renderSankey(graph) {

        // Returns an event handler for fading a given chord group.
        // http://bl.ocks.org/mbostock/4062006
        function fade(opacity) {
            return (g, i) => {
                let nodes = svg.selectAll(".node");

                let siblingNodes = nodes.filter((d) => {
                    return d.name != graph.nodes[i].name;
                });
                siblingNodes
                    .transition('nodeFade') // assign a name to the transition to prevent other transitions from interfering
                    .style("opacity", opacity);

                let links = svg.selectAll(".link");

                // let selectedLinks = links.filter((d) => {
                //     return d.source.name == graph.nodes[i].name || d.target.name == graph.nodes[i].name;
                // });
                // selectedLinks.transition() // assign a name to the transition to prevent other transitions from interfering
                //     .style("fill", "black");

                let siblingLinks = links.filter((d) => {
                    return d.source.name != graph.nodes[i].name && d.target.name != graph.nodes[i].name;
                });
                siblingLinks
                    .transition('linkFade') // assign a name to the transition to prevent other transitions from interfering
                    .style("opacity", opacity);
            };
        }

        // certain text will overlap due to the number of nodes at the lowest level of the graph
        // show text for the nodes that are within the top x% by value
        // construct an array of values from the graph to determine quantiles
        let valueRange = graph.links.map((d) => {
            return d.value;
        });

        valueRange.sort((a, b) => {
            return a - b;
        });

        let nodeNames = graph.nodes.map((d) => {
            return d.name;
        });

        // http://jonathansoma.com/tutorials/d3/color-scale-examples/
        let color = d3.scale.ordinal().domain(nodeNames).range(colorbrewer.Dark2[8]);
        let quantile = d3.quantile(valueRange, p);
        console.log("The " + p + " quantile value is: " + quantile);

        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        // Draw the links
        let links = linksGroup.selectAll(".link")
            .data(graph.links);

        // Enter
        links
            .enter()
            .append("path")
            .attr("class", "link");

        // Enter + Update
        links
        // .style("stroke", (d, i) => {
        //     return d.source.color = color(d.source.name.replace(/ .*/, ""));
        // })
            .transition('pathDraw') // assign a name to the transition to prevent other transitions from interfering
            // .delay(750)
            .duration(750)
            .attr("d", path)
            // .transition('strokeWidth') // assign a name to the transition to prevent other transitions from interfering
            // .duration(250)
            .style("stroke-width", (d) => {
                return Math.max(1, d.dy);
            });

        links
            .sort((a, b) => {
                return b.dy - a.dy;
            });

        // Exit
        links.exit().remove();

        // add in the nodes
        let nodes = nodesGroup.selectAll(".node")
            .data(graph.nodes);

        // Enter
        nodes.enter()
            .append("g")
            .attr("class", "node");

        nodes.append("rect")
            .attr("width", sankey.nodeWidth())
            .style('fill','#ccc')
            .append("title");

        nodes.append("text")
            .attr("dy", ".35em")
            .style('fill','#e5e5e5')
            .attr("transform", null);

        // Enter + Update
        nodes
            .transition('nodeTransform') // assign a name to the transition to prevent other transitions from interfering
            .duration(750)
            .attr("transform", (d) => {
                return "translate(" + d.x + "," + d.y + ")";
            });

        // add the rectangles for the nodes
        nodes.select("rect")
            .attr("height", (d) => {
                return d.dy;
            })
            .transition('rectFill') // assign a name to the transition to prevent other transitions from interfering
            .delay(500)
            .duration(750)
            .style("fill", (d, i) => {
                return d.color = color(d.name.replace(/ .*/, ""));
            })
            .style("stroke", (d) => {
                return d3.rgb(d.color).darker(2);
            });

        nodes.select('text')
            // .transition() // assign a name to the transition to prevent other transitions from interfering
            // .duration(250)
            .attr("x", (d) => {
                if (d.x < width / 2) {
                    return 6 + sankey.nodeWidth();
                }
                else {
                    return -6;
                }
            })
            .attr("text-anchor", (d) => {
                if (d.x < width / 2) {
                    return "start";
                }
                else {
                    return "end";
                }
            })
            .transition('yTextPosition') // assign a name to the transition to prevent other transitions from interfering
            .delay(250)
            .duration(750)
            .attr('y', function(d) {
                return d.dy / 2;
            })
            .style('fill','#000000')
            .text((d) => {
                if (d.value > quantile || (d.x < width / 2)) {
                    return d.name;
                }
                else {
                    return null;
                }
            });

        nodes.exit().remove();

        //http://bl.ocks.org/frischmilch/7667996
        nodes.on("click", fade(0.1))
            .on("mouseout", fade(1));

        return sankey;
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

        for (let i = 0; i < columns.length; i++) {
            cols.push(columns[i].field);
        }
        expand = "";
        filter = "(Value ne 0)";
        top = 5000;

        let componentEndpoint = callData(siteUrl, 'list', 'ISCA', cols.toString(), expand, filter, top);

        // Get the data
        componentEndpoint.get((error, data) => {
            createViz(error, data);
        });

    }

    getData();
})();