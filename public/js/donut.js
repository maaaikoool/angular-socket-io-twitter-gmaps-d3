/* 
 * Copyright (c) 2012 FullScale Labs, LLC
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

angular.module('dangle')
    .directive('fsDonut', [function() {
        'use strict';

        return {
            restrict: 'E',

            // sets up the isolate scope so that we don't clobber parent scope
            scope: {
                outerRadius: '=',
                innerRadius: '=',
                fontSize: '=',
                domain: '=',
                colorMap: '=',
                onClick: '=',
                bind: '=',
                duration: '@'
            },

            link: function(scope, element, attrs) {

                // Setup default parameters.
                var outerRadius = attrs.outerradius || 200;
                var innerRadius = attrs.innerradius || 75;
                var fontSize = attrs.fontsize || 14;
                var fontColor = attrs.fontcolor || "#fff";
                var color = undefined;

                // if no field param is set, use the facet name but normalize the case
                if (attrs.field == undefined) {
                    attrs.field = attrs.bind.split('.').pop().toLowerCase();
                }

                // User can define a color-map so use look for one.
                // If none is found, then use built-in color pallete
                // but see if user has defined a domain of values.
                if (scope.colorMap === undefined) {
                    color = d3.scale.category20c();
                    if (scope.domain !== undefined) {
                        color.domain(scope.domain);
                    }
                } else {
                    color = function(term) {
                        return scope.colorMap[term];
                    }
                }

                // width/height (based on giveb radius)
                var w = outerRadius * 2
                var h = outerRadius *2

                // arc generator 
                var arc = d3.svg.arc()
                    .outerRadius(outerRadius - 10)
                    .innerRadius(innerRadius);

                // d3 utility for creating pie charts
                var pie = d3.layout.pie()
                    .sort(null)
                    .value(function(d) { return d.count; });

                // root svg element
                var svg = d3.select(element[0])
                    .append('svg')
                        .attr('preserveAspectRatio', 'xMinYMin meet')
                        .attr('viewBox', '0 0 ' + w + ' ' + h);

                // group for arcs
                var arcs = svg.append('g')
                    .attr('transform', 'translate(' + w/2 + ',' + h/2 + ') rotate(180) scale(-1, -1)');

                // group for labels
                var labels = svg.append("g")
                    .attr("class", "label_group")
                    .attr("transform", "translate(" + (w/2) + "," + (h/2) + ")");


                // Wrap the main drawing logic in an Angular watch function.
                // This will get called whenever our data attribute changes.
                scope.$watch('bind', function(data) {

                    var duration = scope.duration || 0;

                    // arc tweening
                    function arcTween(d, i) {
                        var i = d3.interpolate(this._current, d);
                        this._current = i(0);
                        return function(t) {
                            return arc(i(t));
                        };
                    }
        
                    // label tweening
                    function textTween(d, i) {
                        var a = (this._current.startAngle + this._current.endAngle - Math.PI)/2;
                        var b = (d.startAngle + d.endAngle - Math.PI)/2;

                        var fn = d3.interpolateNumber(a, b);
                        return function(t) {
                            var val = fn(t);
                            return "translate(" + 
                                Math.cos(val) * (outerRadius -innerRadius) + "," + 
                                Math.sin(val) * (outerRadius -innerRadius) + ")";
                        };
                    }

                    // determines the anchor point of a label
                    var findAnchor = function(d) {
                        // if ((d.startAngle + d.endAngle)/2 < Math.PI ) {
                        //     return "beginning";
                        // } else {
                        //     return "end";
                        // }
                        return "middle";
                    };

                    var textOffset = 14;

                    // if data is not null
                    if (data) { 

                        // pull out the terms array from the facet
                        data = data.terms || [];
                        var pieData = pie(data);

                        // calculate the sum of the counts for this facet
                        var sum = 0;
                        for (var ii=0; ii < data.length; ii++) {
                            sum += data[ii].count;
                        }

                        // if the sum is 0 then this facet has no valid entries (all counts were zero)
                        if (sum > 0) {

                            // update the arcs
                            var path = arcs.selectAll('path').data(pieData);
                            path.enter()
                                .append('path') 
                                    .attr('d', arc)
                                    .attr('stroke', '#fff')
                                    .attr('stroke-width', '1.5')
                                    .attr('cursor', 'pointer')
                                    .style('fill', function(d) { return color(d.data.term); })
                                    .each(function(d) { this._current = d; })
                                    .on('mousedown', function(d) {
                                        scope.$apply(function() {
                                            (scope.onClick || angular.noop)(attrs.field, d.data.term);
                                        });
                                    });

                            // run the transition
                            path
                                .style('fill', function(d) { return color(d.data.term); })
                            .transition()
                                .duration(duration)
                                .attrTween('d', arcTween)
                                .style('fill', function(d) { return color(d.data.term); });

                            // remove arcs not in the dataset
                            path.exit().remove();

                            // update the label ticks
                            var ticks = labels.selectAll('line').data(pieData);
                            ticks.enter().append('line')
                                .attr('x1', 0)
                                .attr('x2', 0)
                                .attr('y1', innerRadius-outerRadius - 6)
                                .attr('y2', innerRadius-outerRadius -10)
                                .attr('stroke', 'grey')
                                .attr('stroke-width', 2.0)
                                .attr('transform', function(d) {
                                    return 'rotate(' + (d.startAngle + d.endAngle)/2 * (180/Math.PI) + ')'; // radians to degrees
                                })
                                .each(function(d) {this._current = d;});

                            // run the transition
                            ticks.transition()
                                .duration(750)
                                .attr("transform", function(d) {
                                    return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
                            });

                            // flush old entries
                            ticks.exit().remove();

                           
                            // update the value labels 
                            var nameLabels = labels.selectAll("text.units").data(pieData)
                                .attr("dy", function(d){
                                    if ((d.startAngle + d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
                                        return 2;
                                    } else {
                                        return 2;
                                    }
                                })
                                .attr("text-anchor", function(d){
                                    // if ((d.startAngle + d.endAngle)/2 < Math.PI ) {
                                    //     return "beginning";
                                    // } else {
                                    //     return "end";
                                    // }
                                    return "middle";
                                }).text(function(d) {
                                    if (d.data.term === 'T') {
                                        return 'TRUE' + ' (' + d.value + ')';
                                    } else if (d.data.term === 'F') {
                                        return 'FALSE'+ ' (' + d.value + ')';
                                    } else {
                                        return d.data.term;
                                    }
                                });

                            nameLabels.enter().append("text")
                                .attr("class", "units")
                                .attr('font-size', fontSize)
                                .attr('stroke', 'none')
                                .attr('fill', '#000')
                                .attr("transform", function(d) {
                                    return "translate(" + 
                                        Math.cos(((d.startAngle + d.endAngle - Math.PI)/2)) * (outerRadius -innerRadius) + "," + 
                                        Math.sin((d.startAngle + d.endAngle - Math.PI)/2) * (outerRadius -innerRadius) + ")";
                                })
                                .attr("dy", function(d){
                                    if ((d.startAngle + d.endAngle)/2 > Math.PI/2 && (d.startAngle + d.endAngle)/2 < Math.PI*1.5 ) {
                                        return 2;
                                    } else {
                                        return 2;
                                    }
                                })
                                .attr('text-anchor', findAnchor)
                                .text(function(d){
                                    if (d.data.term === 'T') {
                                        return 'TRUE' + ' (' + d.value + ')';
                                    } else if (d.data.term === 'F') {
                                        return 'FALSE' + ' (' + d.value + ')';
                                    } else {
                                        return d.data.term;
                                    }
                                })
                                .each(function(d) {this._current = d;});

                            // run the transition
                            nameLabels.transition().duration(duration).attrTween("transform", textTween);
    
                            // flush old entries
                            nameLabels.exit().remove();

                        } else {
                            // if the facet had no valid entries then remove the chart
                            svg.selectAll('path').remove();
                            labels.selectAll('line').remove();
                            labels.selectAll("text.value").remove();
                            labels.selectAll("text.units").remove();
                        }

                    }
                })

            }
        };
    }]);
