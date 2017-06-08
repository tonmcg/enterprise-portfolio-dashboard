"use strict";

// define data
const columns = [
{
    "label": "Investment Number",
    "field": "InvestmentNumber",
    "format": function(d) { return d['Investment Number']; },
    "type": "string",
    "display": false,
    "sort": false
}, {
    "label": "Year",
    "field": "Year",
    "format": function(d) { return d.Year; },
    "type": "integer",
    "display": false,
    "sort": false
}, {
    "label": "Component",
    "field": "Component",
    "format": function(d) { return d.Component; },
    "type": "string",
    "display": true,
    "sort": false
}, {
    "label": "Investment Name",
    "field": "Investment Name",
    "format": function(d) { return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + d['InvestmentName'] + "</a>"; },
    "type": "string",
    "display": true,
    "sort": true
}, {
    "label": "Service",
    "field": "Service",
    "format": function(d) { return d.Service; },
    "type": "string",
    "display": true,
    "sort": false
}, {
    "label": "Category",
    "field": "Category",
    "format": function(d) { return d.Category; },
    "type": "string",
    "display": true,
    "sort": false
}, {
    "label": "Business Area",
    "field": "Business Area",
    "format": function(d) { return d['Business Area']; },
    "type": "string",
    "display": true,
    "sort": false
}, {
    "label": "Total",
    "field": "Value",
    "format": function(d) { return currFormat(+d.Value); },
    "type": "double",
    "display": true,
    "sort": false
}];

// create spinner
var target = d3.select("#dashboard").node();
// create tooltip
var tooltip = d3.select("body").append("div").style({
    "position": "absolute",
    "z-index": "10",
    "visibility": "hidden"
}).attr({
    "class": "tooltip"
});
// trigger loader
var spinner = new Spinner(opts).spin(target);

var width;

// load the data
function createViz(error, data) {

    // patterned after Customized Paraset
    // http://bl.ocks.org/mydu/67692343b28ea5069177


    // TODO: implement a renderSandkey function with enter and exit pattern
    // https://bl.ocks.org/austinczarnecki/cc6371af0b726e61b9ab

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    // dimensions for the charts
    var dashboardHeight = getSize().height;
    var headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
    var footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;
    
    var sankeyHeaderHeight = document.querySelector('#sankey header').offsetHeight;
    var sankeyFooterHeight = document.querySelector('#sankey footer').offsetHeight;
    var height = (dashboardHeight - headerHeight - footerHeight - sankeyHeaderHeight - sankeyFooterHeight) * 8 / 9;
    
    width = document.querySelector('#sankey footer').offsetWidth - 16;
    
    var color = d3.scale.category20();

    var margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };
    
    // append the svg canvas to the page
    var svg = d3.select("#component").append("svg")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margins.left + "," + (+margins.top) + ")");
    
    // Set the sankey diagram properties
    var sankey = d3.sankey()
        .nodeWidth(36)
        .nodePadding(2)
        .size([width, height]);
    
    var path = sankey.link();
    
    // set crossfilter
    let ndx = crossfilter(data.value);

    // define dimensions
    var
        componentDim = ndx.dimension(function(d) {
            return d.Component;
        });
        
    // group dimensions
    var
        amountByComponent = componentDim.group().reduceSum(function(d) {
            return Math.round(+d.Value);
        });
        
    // dc.js chart types
    let componentSelect = dc.selectMenu('#components');

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
        .title(function(d) {
            return d.key;
        })
        .promptText('All Components')
        .promptValue(null);

    componentSelect.on('pretransition', function(chart) {
        // add styling to select input
        d3.select('#components').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });
    
    dc.renderAll();
    
    // transform JSON data array into sankey graph object with nodes and links arrays
    // inspired by DensityDesign Lab raw.js functions by Giorgio Caviglia, Michele Mauri, Giorgio Uboldi, Matteo Azzi
    // http://app.rawgraphs.io/
    function transformToGraph(data) {
        var steps = [];
    
        steps.push("Business Area", "Category", "Service");
    
        var d = {
            nodes: [],
            links: []
        }
    
        if (!steps || steps.length < 2) return d;
    
        var n = [],
            l = [],
            si, ti;
    
        for (var i = 0; i < steps.length - 1; i++) {
    
            var sg = steps[i];
            var tg = steps[i + 1];
            var relations = d3.nest()
                .key(function(d) {
                    return d[sg];
                })
                .key(function(d) {
                    return d[tg];
                })
                .entries(data.value);
    
            relations.forEach(function(s) {
                si = getNodeIndex(n, s.key, sg);
    
                if (si == -1) {
                    n.push({
                        name: s.key,
                        group: sg
                    });
                    si = n.length - 1;
                }
    
                s.values.forEach(function(t) {
                    ti = getNodeIndex(n, t.key, tg);
                    if (ti == -1) {
                        n.push({
                            name: t.key,
                            group: tg
                        });
                        ti = n.length - 1;
                    }
                    var value = t.values.length;
                    var link = {
                        source: n[si],
                        target: n[ti],
                        value: value
                    };
                    l.push(link);
                });
            });
        }
        d.nodes = n.sort(customSort);
        l.forEach(function(d) {
            d.source = n.indexOf(d.source);
            d.target = n.indexOf(d.target);
        });
        d.links = l;
        
        function customSort(a, b) {
            var Item1 = a.group;
            var Item2 = b.group;
            if (Item1 != Item2) {
                return (Item1.localeCompare(Item2));
            }
            else {
                return (a.name.localeCompare(b.name));
            }
        }
    
        function getNodeIndex(array, name, group) {
            for (var i in array) {
                var a = array[i];
                if (a['name'] == name && a['group'] == group) {
                    return i;
                }
            }
            return -1;
        }
        
        return d;
    
    }

    var graph = transformToGraph(data);

    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(32);

    // add in the links
    var link = svg.append("g").selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function(d) {
            return Math.max(1, d.dy);
        })
        // .style("stroke", function(d,i) { 
        //   return d.source.color = color(d.source.name.replace(/ .*/, ""));
        //   // return color[i];
        // })
        .sort(function(a, b) {
            return b.dy - a.dy;
        });

    // add the link titles
    link.append("title")
        .text(function(d) {
            return d.source.name + " → " +
                d.target.name + "\n" + formatAbbreviation(d.value);
        });

    // add in the nodes
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .call(d3.behavior.drag()
            .origin(function(d) {
                return d;
            })
            .on("dragstart", function() {
                this.parentNode.appendChild(this);
            })
            .on("drag", dragmove))
        //http://bl.ocks.org/frischmilch/7667996
        .on("mouseover", fade(0.4))
        .on("mouseout", fade(1));

    // add the rectangles for the nodes
    node.append("rect")
        .attr("height", function(d) {
            return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d, i) {
            return d.color = color(d.name.replace(/ .*/, ""));
        })
        .style("stroke", function(d) {
            return d3.rgb(d.color).darker(2);
        })
        .append("title")
        .text(function(d) {
            return d.name + "\n" + formatAbbreviation(d.value);
        });

    var valueRange = node.data().map(function(d) {
        return d.value;
    });

    valueRange.sort();

    var quantile = d3.quantile(valueRange, 0.85);
    console.log(quantile);

    // // add in the title for the nodes
    node.append("text")
        .attr("x", -6)
        .attr("y", function(d) {
            return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d) {
            if (d.value > quantile) {
                return d.name;
            }
            else {
                return null;
            }
        })
        .filter(function(d) {
            return d.x < width / 3;
        })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    setResponsiveSVG(d3);

    // the function for moving the nodes
    function dragmove(d) {
        d3.select(this).attr("transform",
            "translate(" + d.x + "," + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
        sankey.relayout();
        link.attr("d", path);
    }

    // Returns an event handler for fading a given chord group.
    // http://bl.ocks.org/mbostock/4062006
    function fade(opacity) {
        return function(g, i) {
            var elements = svg.selectAll(".node");
            elements = elements.filter(function(d) {
                return d.name != graph.nodes[i].name;
            });
            elements.transition()
                .style("opacity", opacity);

            svg.selectAll(".link")
                .filter(function(d) {
                    return d.source.name != graph.nodes[i].name && d.target.name != graph.nodes[i].name;
                })
                .transition()
                .style("opacity", opacity);
        };
    }
};

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

    for (let i = 0;i<columns.length;i++) {
        cols.push(columns[i].field);
    }
    expand = "";
    filter = "(Value ne 0)";
    top = 5000;

    let componentEndpoint = callData(siteUrl, 'list', 'ISCA', cols.toString(), expand, filter, top);

    // Get the data
    componentEndpoint.get(function(error, data) {
        createViz(error, data);
    });

}

getData();