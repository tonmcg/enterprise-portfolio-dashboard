// https://www.snip2code.com/Snippet/146410/Crossfilter-to-Sankey
function crossfilterToSankeyData(dimension, node_columns, measure_column) {
  // source
  var s = dimension.top(Infinity);
  // target
  var t = {nodes: [], links: []};

  s.forEach(function(row){
    insertNodes(row);
    insertOrUpdateLinks(row);
  });

  function insertNodes(row) {
  	node_columns.forEach(function(column){
      if (!nodesContains(row, column)){
      	t.nodes.push({name: row[column], column_name: column});
      }
    });
  }

  function insertOrUpdateLinks(row) {
    node_columns.forEach(function(column, index){
      if (index < (node_columns.length-1)){
      	var nextNodeColumn = node_columns[index+1];
        insertOrUpdateLink({name: row[column], column: column}, {name: row[nextNodeColumn], column: nextNodeColumn}, row[measure_column]);
      }  
    });
  }

  function insertOrUpdateLink(source, target, value){
    var foundLink = findLink(source,target);
    if(foundLink) {
      foundLink.value = foundLink.value + Number(value);
    } else {
      t.links.push(newLink(source, target, value));
    }
  }

  function findLink(source, target){
  	var sourceIndex = indexForNode(source);
  	var targetIndex = indexForNode(target);
  	var len = t.links.length;
  	for(var i=0;i<len;i++){
      var currentLink = t.links[i];
      if(currentLink.source === sourceIndex && currentLink.target === targetIndex){
      	return currentLink;
      }
  	}
  	return false;
  }

  function newLink(source, target, value){
    return {source: indexForNode(source), target: indexForNode(target), value: Number(value)};
  }

  function indexForNode(node){
  	var len = t.nodes.length;
  	for(var i=0;i<len;i++){
      var currentNode = t.nodes[i];
      if (currentNode.name === node.name && currentNode.column_name === node.column) return i;
  	}
  	return -1;
  }

  function nodesContains(row, column){
    return t.nodes.some(function(node){ return node.name === row[column] && node.column_name === column});
  }

  function linksContains(source, target){

  }
  
  return t;
};