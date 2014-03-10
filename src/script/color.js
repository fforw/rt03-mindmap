"use strict";

var LUM_THRESHOLD = 0.03928;

var PERCEPTIVE_FACTOR_RED = 0.2126;
var PERCEPTIVE_FACTOR_GREEN = 0.7152;
var PERCEPTIVE_FACTOR_BLUE = 0.0722;

var colorRegExp = /#?([0-9a-f]{3}|[0-9a-f]{6})/gi;

function checkColor(color)
{

    var m;
    if (typeof color !== "string" || !(m = colorRegExp.exec(color)))
    {
        return null;
    }
    var col = m[1];

    if (col.length == 3)
    {
        return {
            r: parseInt(col[0], 16) / 15,
            g: parseInt(col[1], 16) / 15,
            b: parseInt(col[2], 16) / 15
        };
    }
    else if (col.length == 6)
    {
        return {
            r: parseInt(col.substring(0, 2), 16) / 255,
            g: parseInt(col.substring(2, 4), 16) / 255,
            b: parseInt(col.substring(4, 6), 16) / 255
        };
    }
    else
    {
        return null;
    }
}

function components(color)
{
    var col = checkColor(color);
    if (!col)
    {
        throw new Error("Invalid color " + color);
    }
    return col;
}

function gun_luminance(v)
{

    if (v <= LUM_THRESHOLD)
    {
        return v / 12.92
    }
    else
    {
        return Math.pow(((v + 0.055) / 1.055), 2.4);
    }
}

function hex(n)
{
    var s = n.toString(16);

    return s.length == 1 ? "0" + s : s;
}

// Contrast and luminance calculation follows http://www.w3.org/Translations/WCAG20-de/#contrast-ratiodef
var color = {
    isColor: function(color)
    {
        var col = checkColor(color);
        return col && !isNaN(col.r) && !isNaN(col.g) && !isNaN(col.b);
    },

    components: components,

    getLuminance: function (color)
    {
        var c = components(color)
        return PERCEPTIVE_FACTOR_RED * gun_luminance(c.r) + PERCEPTIVE_FACTOR_GREEN * gun_luminance(c.g) + PERCEPTIVE_FACTOR_BLUE * gun_luminance(c.b);
    },

    contrast: function (colorA, colorB)
    {
        var h;
        var lum1 = color.getLuminance(colorA);
        var lum2 = color.getLuminance(colorB);

        if (lum1 < lum2)
        {
            h = lum1;
            lum1 = lum2;
            lum2 = h;
        }

        var contrast = (lum1 + 0.05) / (lum2 + 0.05);

//        console.debug("contrast: %o", contrast);

        return  contrast;
    },

    mix: function (col1, col2, ratio)
    {
        var c1 = components(col1);
        var c2 = components(col2);

        var r = (c1.r + (c2.r - c1.r) * ratio) | 0;
        var g = (c1.g + (c2.g - c1.g) * ratio) | 0;
        var b = (c1.b + (c2.b - c1.b) * ratio) | 0;

        return rgb(r, g, b);
    },

    rgb: function (r, g, b)
    {
        return "#" + hex(r) + hex(g) + hex(b);
    },

    fade: function (color, opacity)
    {
        var col = components(color);
        return "rgba(" + col.r + ", " + col.g + ", " + col.b + ", " + opacity + ")";
    }

};
module.exports = color;