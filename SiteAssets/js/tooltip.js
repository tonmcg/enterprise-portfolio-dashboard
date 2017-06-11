// Show tooltip on hover
function showDetail( key, amount, count, percent ) {

    // show tooltip with information from the __data__ property of the element
    var x_hover = 0;
    var y_hover = 0;
    
    var content = "<b>" + key + "</b><br/>";
        
    if (amount != null) content += "<b>Amount: </b>" + amount + "<br/>";
    if (count != null) content += "<b>Count: </b>" + count + "<br/>";
    if (percent != null) content += "<b>Percent: </b>" + percent + "<br/>";
    
    var tooltipWidth = parseInt(tooltip.style('width'));
    var tooltipHeight = parseInt(tooltip.style('height'));
    x_hover = (event.pageX > document.body.clientWidth / 2) ? tooltipWidth + 30 : -30;
    y_hover = (document.body.clientHeight - event.pageY < (tooltipHeight + 4)) ? event.pageY-(tooltipHeight + 4) : event.pageY - tooltipHeight/2;

    return tooltip
        .classed('right',true)
        .style({
            "visibility": "visible",
            "top": y_hover + "px",
            "left": (event.pageX - x_hover) + "px"

        })
        .html(content);
}

// Hide tooltip on hover
function hideDetail() {

    // hide tooltip
    return tooltip.style("visibility", "hidden");
}