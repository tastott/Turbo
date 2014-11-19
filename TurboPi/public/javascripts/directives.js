///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/jquery.d.ts" />
///<reference path="./typings/segment.d.ts" />
var directives;
(function (directives) {
    function SegmentDisplay() {
        var directive = {
            scope: {
                text: '@'
            },
            link: function (scope, element, attributes) {
                //var canvas = $('<canvas></canvas>').appendTo(element);
                //canvas.width(element.width());
                //canvas.height(element.height());
                var segment16 = new SixteenSegment(8, element[0]);
                segment16.FillDark = '#001100';

                scope.$watch('text', function (newValue, oldValue) {
                    segment16.DispayText(newValue);
                });
            }
        };

        return directive;
    }
    directives.SegmentDisplay = SegmentDisplay;
})(directives || (directives = {}));
