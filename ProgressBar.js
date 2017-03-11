/*\
title: $:/plugins/OokTech/ProgressBar/ProgressBar.js
type: application/javascript
module-type: widget

A widget that creates a progress bar with progress defined by filters.

The most basic usage takes two filters, one for finished and one for unfinished.
The total is defined as the total number of tiddlers returned by both filters
The progress is shown as the percentage of tiddlers from the finished filter in
green, the remaining part of the bar is shown in red. Percentages are shown for
both finished and unfinished parts.

Basic usage:

To make a progress bar that shows the a returned by [tag[task]!tag[done]] as
unfinished and [task[done]tag[done]] and uses the default class just put

<$ProgressBar/>

to specify the filters used to determine the number of finished and unfinished tasks use:

<$ProgressBar finished=<<finishedFilter>> unfinished=<<unfinishedFilter>>/>

Advanced usage:

you can give a comma separated list of filters, each filter represents one segment of the bar, the color list determines the colors for each segment. If there are more segments than colors than the color list is repeated. You can also give a css class that will be used instead of the default css:

<$ProgressBar filters="comma separated list of filters" colors="comma separated list of colors" class="custom-class"/>

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var widgets;
var container;

var ProgressBar = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ProgressBar.prototype = new Widget();

/*
Render this widget into the DOM
*/
ProgressBar.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement("div");
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
ProgressBar.prototype.execute = function() {
	//Get widget attributes.
	this.finishedFilter = this.getAttribute("finished", '[tag[task]tag[done]]');
	this.unfinishedFilter = this.getAttribute("unfinished", '[tag[task]!tag[done]]');
	this.filters = this.getAttribute("filters");
	var TotalWidth = this.getAttribute("width","100");
	var widthUnit = this.getAttribute("unit", "%");
	var colors = this.getAttribute("colors");
	var barClass = this.getAttribute("class", "progress-bar");

	//This updates the current state of the bar
	var Total = this.GetBarState();
	//This saves the state so that refreshes work correctly
	this.OldBarState = this.BarState;

	//Initialise colors
	var colorList = ['red','green'];
	var thisColor = 'red';
	//Get the list of colors, if any. If there isn't a color list given the
	//default defined above is used.
	if (colors) {
		colorList = colors.split(",");
	}

	var segments = this.BarState.split(",");
	//Build the html for making the progress bar
	var ProgressBarString = "<div class='progress-bar'>";
	//Add each segment to the bar in order
	for (var segment in segments) {
		//If the color list is shorter than the number of segments than the
		//list loops.
		thisColor = colorList[(segment-1)%colorList.length];
		//Only add a new segment if has a non-zero length
		if (segments[segment] > 0) {
			//Each segment is a div
			ProgressBarString += "<div style='width:" + segments[segment]/Total*100 + "%;background-color:" + thisColor + ";'>" + Math.round(segments[segment]/Total*100) + "%</div>";
		}
	}
	//Close the div
	ProgressBarString += "</div>";

	//This is the part that actually displays the bar in the wiki
	var parser = this.wiki.parseText("text/vnd.tiddlywiki",ProgressBarString,{parseAsInline: false});
	var parseTreeNodes = parser ? parser.tree : [];
	this.makeChildWidgets(parseTreeNodes);

};

/*
This makes a value that can be checked against to see if the bar needs to be updates.
*/
ProgressBar.prototype.GetBarState = function () {
	var currentSegment = 0;
	var Total = 0;
	//Get the list of filters, if the filters attribute is given it overrides
	//the finished and unfinished filters if they are given.
	var filterList = [];
	if (this.filters) {
		filterList = this.filters.split(",");
	} else {
		filterList = [this.finishedFilter, this.unfinishedFilter];
	}

	//this.BarState is used to determine if the bar should be updated or not.
	//It is a string that will change if the bars apperance should change.
	this.BarState = "";
	//Get the output from each filter
	for (var filter in filterList) {
		currentSegment = this.wiki.filterTiddlers(filterList[filter]).length;
		Total += currentSegment;
		this.BarState += "," + String(currentSegment);
	}
	return Total;
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
ProgressBar.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	//This may be able to be more efficient, but I can't think of how at the moment.
	this.GetBarState();
	if(Object.keys(changedAttributes).length || this.OldBarState !== this.BarState) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["ProgressBar"] = ProgressBar;

})();
