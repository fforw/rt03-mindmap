"use strict";

/**
 * TreeLayout helper class. Can layout an hierarchical tree to be both space conserving and pretty.
 * 
 * based on "Node-Positioning for General Trees", by John Q. Walker II
*/
    
var defaultOptions = {
NODE_WIDTH         : 50,  /* Width of a node?       */
NODE_HEIGHT        : 20,  /* Height of a node?      */
SUBTREE_SEPARATION : 20,   /* Gap between subtrees?  */
SIBLING_SEPARATION : 10,   /* Gap between siblings?  */
LEVEL_GAP          : 20,   /* Gap between levels?    */
MAXIMUM_DEPTH      : 10,  /* Biggest tree?          */
ROOT_ORIENTATION   : "NORTH"
};    


var blacklist = {
    parent: 1,
    offspring: 1,
    leftsibling: 1,
    rightsibling: 1,
    xCoordinate: 1,
    yCoordinate: 1,
    prev: 1,
    flPrelim: 1,
    flModifier: 1
};

/**
 * This class is mostly a suggestion. You can extend it in your own code or give
 * in your own type with the expected members.
 *  
 */
function TreeLayoutNode()
{
    // These define the tree structure and must be set in advance.
    this.parent = null;
    this.offspring = null;
    this.leftsibling = null;
    this.rightsibling = null;
    
    // must only be set for the root node 
    this.xCoordinate = 0;
    this.yCoordinate = 0;
    
    // these get calculated
    this.prev = null;
    this.flPrelim = 0;
    this.flModifier = 0;

}

TreeLayoutNode.fromJSON = function (json)
{
    var rs, kids, length;
    var data = typeof json === "string" ? JSON.parse(json) : json;

    var node = new TreeLayoutNode();

    for (var prop in data)
    {
        if (data.hasOwnProperty(prop))
        {
            if (prop === "kids")
            {
                kids = data[prop];

                length = kids.length;
                if (length && kids[0])
                {
                    var ls = TreeLayoutNode.fromJSON(kids[0]);
                    node.offspring = ls;
                    ls.parent = node;

                    for (var i = 1; i < length; i++)
                    {
                        rs = TreeLayoutNode.fromJSON(kids[i]);
                        rs.parent = node;

                        ls.rightsibling = rs;
                        rs.leftsibling = ls;

                        ls = rs;
                    }

                }
            }
            else
            {
                node[prop] = data[prop];
            }
        }
    }

    return node;
}



TreeLayoutNode.prototype.copy = function()
{
    var clone = new TreeLayoutNode();
    extend(clone, this);
    return  clone;
}

TreeLayoutNode.prototype.addChild = function(node, after)
{

    var rs;
    node.parent = this;
    node.rightsibling = null;
    
    if (this.offspring)
    {
        if (!after)
        {
            after = this.offspring;
            while ((rs = after.rightsibling))
            {
                after = rs;
            }
        }

        if (after.rightsibling)
        {
            node.rightsibling = after.rightsibling;
            node.rightsibling.leftsibling = node;
        }

        after.rightsibling = node;
        node.leftsibling = after;
    }
    else
    {
        this.offspring = node;
        node.leftsibling = null;
    }
};


TreeLayoutNode.prototype.visit = function(callback, ctx)
{
    if (callback.call(ctx, this) === false)
    {
        return false;
    }

    var rs = this.rightsibling;
    if (rs)
    {
        if (rs.visit(callback, ctx) === false)
        {
            return false;
        }
    }

    var off = this.offspring;
    if (off)
    {
        if (off.visit(callback, ctx) === false)
        {
            return false;
        }
    }

    return true;
};

TreeLayoutNode.prototype.forEachKid = function (callback, ctx)
{
    var kid = this.offspring;
    while (kid)
    {
        callback.call(ctx, kid);
        kid = kid.rightsibling;
    }
};

TreeLayoutNode.prototype.toJSON = function ()
{
    var l = ["{"];

    for (var prop in this)
    {
        if (this.hasOwnProperty(prop) && !blacklist[prop])
        {
            l.push(JSON.stringify(prop), ": ", JSON.stringify(this[prop]), ", ");
        }

        if (!this.parent)
        {
            l.push("\"xCoordinate\":", this.xCoordinate, ", \"yCoordinate\":", this.yCoordinate, ", ");
        }
    }

    var kid = this.offspring;
    l.push("\"kids\":[")
    var first = true;
    while (kid)
    {
        l.push(first? "": ", ", kid.toJSON())
        kid = kid.rightsibling;
        first = false;
    }

    l.push("]}");

    return l.join("");
};

function TreeLayoutAABB()
{
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
}


TreeLayoutAABB.prototype = {
add:
    function(x,y)
    {
        this.minX = Math.min(this.minX, x);
        this.minY = Math.min(this.minY, y);
        this.maxX = Math.max(this.maxX, x);
        this.maxY = Math.max(this.maxY, y);
    },
width:
    function()
    {
    return (this.maxX - this.minX) | 0;
    },
height:
    function()
    {
        return (this.maxY - this.minY) | 0;
    }
};

function extend()
{
//    ("extend: %o", arguments);

    var src, dst, len = arguments.length;
    for (var i = len - 1 ; i > 0; i-- )
    {
        src = arguments[i];
        dst = arguments[i - 1];
        for (var k in  src)
        {
            if (src.hasOwnProperty(k))
            {
                dst[k] = src[k];
            }
        }
    }

//    ("dst : %o", dst);

    return dst;
}


function TreeLayout( options)
{
    this.options = extend({}, defaultOptions, options);
    this.flMeanWidth = 0;

    this.xTopAdjustment = 0;
    this.yTopAdjustment = 0;
    this.aabb = new TreeLayoutAABB();
}

TreeLayout.prototype = {
getConfigValue:
    function (name,node)
    {
        var v = this.options[name];
    
        if (typeof v == "function")
        {
            return v.call(this, node);
        }
        return v;
    },
_meanNodeSize: 
    function(pLeftNode, pRightNode)
    {
       this.flMeanWidth = 0;   /* Initialize this global */
    
       
       switch (this.options.ROOT_ORIENTATION) 
       {
          case "NORTH":
          case "SOUTH":
             if (pLeftNode) 
             {
                 this.flMeanWidth +=  this.getConfigValue("NODE_WIDTH", pLeftNode) / 2;
             }
             if (pRightNode) 
             {
                 this.flMeanWidth +=  this.getConfigValue("NODE_WIDTH", pRightNode) / 2;
             }
             break;
          case "EAST":
          case "WEST":
              if (pLeftNode) 
              {
                  this.flMeanWidth +=  this.getConfigValue("NODE_HEIGHT", pLeftNode) / 2;
              }
              if (pRightNode) 
              {
                  this.flMeanWidth +=  this.getConfigValue("NODE_HEIGHT", pRightNode) / 2;
              }
             break;
       }
    },
_getLeftmost:
    function (pThisNode, nCurrentLevel, nSearchDepth)
    {
       /*------------------------------------------------------
        * Determine the leftmost descendant of a node at a
        * given depth. This is implemented using a post-order
        * walk of the subtree under pThisNode, down to the
        * level of nSearchDepth. If we've searched to the
        * proper distance, return the currently leftmost node.
        * Otherwise, recursively look at the progressively
        * lower levels.
        *----------------------------------------------------*/

       var pLeftmost;    /* leftmost descendant at level   */
       var pRightmost;   /* rightmost offspring in search  */

       if (nCurrentLevel == nSearchDepth)
       {
          return pThisNode; /*  searched far enough.    */
       }
       else if (!pThisNode.offspring)
       {
           return null;  /* This node has no descendants    */
       }
       else 
       {  
           pRightmost = pThisNode.offspring;
           pLeftmost = this._getLeftmost(pRightmost, nCurrentLevel + 1, nSearchDepth);
           
           while((pLeftmost == null) && (pRightmost.rightsibling))
           {
               pRightmost = pRightmost.rightsibling;
               pLeftmost = this._getLeftmost(pRightmost, nCurrentLevel + 1, nSearchDepth);
           }
           return pLeftmost;
       }
    },
_apportion:
    function(pThisNode, nCurrentLevel)
{
    /*------------------------------------------------------
     * Clean up the positioning of small sibling subtrees.
     * Subtrees of a node are formed independently and
     * placed as close together as possible. By requiring
     * that the subtrees be rigid at the time they are put
     * together, we avoid the undesirable effects that can
     * accrue from positioning nodes rather than subtrees.
     *----------------------------------------------------*/

    var pLeftmost;            /* leftmost at given level*/
    var pNeighbor;            /* node left of pLeftmost */
    var pAncestorLeftmost;    /* ancestor of pLeftmost  */
    var pAncestorNeighbor;    /* ancestor of pNeighbor  */
    var pTempPtr;             /* loop control pointer   */
    var i;                    /* loop control           */
    var nCompareDepth = 1;    /* depth of comparison    */
    /* within this proc       */
    var nDepthToStop;         /* depth to halt          */
    var nLeftSiblings;        /* nbr of siblings to the */
    /* left of pThisNode, including pThisNode,  */
    /* til the ancestor of pNeighbor            */
    var flLeftModsum;         /* sum of ancestral mods  */
    var flRightModsum;        /* sum of ancestral mods  */
    var flDistance;           /* difference between     */
    /* where pNeighbor thinks pLeftmost should be   */
    /* and where pLeftmost actually is              */
    var flPortion;            /* proportion of          */
    /* flDistance to be added to each sibling       */

    pLeftmost = pThisNode.offspring;
    pNeighbor = pLeftmost.prev;

    nCompareDepth = 1;
    nDepthToStop = this.options.MAXIMUM_DEPTH - nCurrentLevel;

    while ((pLeftmost) && (pNeighbor) &&
            (nCompareDepth <= nDepthToStop)) 
    {

        /* Compute the location of pLeftmost and where it */
        /* should be with respect to pNeighbor.           */
        flRightModsum = flLeftModsum = 0;
        pAncestorLeftmost = pLeftmost;
        pAncestorNeighbor = pNeighbor;

        for (i = 0; i < nCompareDepth; i++) 
        {
            pAncestorLeftmost = pAncestorLeftmost.parent;
            pAncestorNeighbor = pAncestorNeighbor.parent;
            flRightModsum += pAncestorLeftmost.flModifier;
            flLeftModsum += pAncestorNeighbor.flModifier;
        }

        /* Determine the flDistance to be moved, and apply*/
        /* it to "pThisNode's" subtree.  Apply appropriate*/
        /* portions to smaller interior subtrees          */

        /* Set the global mean width of these two nodes   */
        this._meanNodeSize(pLeftmost, pNeighbor);

        flDistance = (pNeighbor.flPrelim +
                flLeftModsum +
                this.options.SUBTREE_SEPARATION +
                this.flMeanWidth) -
                (pLeftmost.flPrelim + flRightModsum);

        if (flDistance > 0) 
        {
            /* Count the interior sibling subtrees        */
            nLeftSiblings = 0;
            for (pTempPtr = pThisNode; (pTempPtr) && (pTempPtr !== pAncestorNeighbor);  pTempPtr = pTempPtr.leftsibling) 
            {
                nLeftSiblings++;
            }

            if (pTempPtr) 
            {
                /* Apply portions to appropriate          */
                /* leftsibling subtrees.                  */

                flPortion = flDistance / nLeftSiblings;
                for (pTempPtr = pThisNode; (pTempPtr != pAncestorNeighbor);  pTempPtr = pTempPtr.leftsibling) 
                {
                    pTempPtr.flPrelim += flDistance;
                    pTempPtr.flModifier += flDistance;

                    flDistance -= flPortion;
                }
            }
            else {
                /* Don't need to move anything--it needs  */
                /* to be done by an ancestor because      */
                /* pAncestorNeighbor and                  */
                /* pAncestorLeftmost are not siblings of  */
                /* each other.                            */
                return;
            }
        }  /* end of the while                           */

        /* Determine the leftmost descendant of pThisNode */
        /* at the next lower level to compare its         */
        /* positioning against that of its pNeighbor.     */

        nCompareDepth++;

        if (pLeftmost && !pLeftmost.offspring)
        {
            pLeftmost = this._getLeftmost(pThisNode, 0, nCompareDepth);
//              if (pLeftmost == null)
//              {
//              throw new Error("pLeftmost is null for " + pThisNode.name + ", 0, " + nCompareDepth);
//              }
        }
        else
        {
            pLeftmost = pLeftmost.offspring;
        }
        if (pLeftmost)
        {
            pNeighbor = pLeftmost.prev;
        }
    }
},
_firstWalk: 
    function(pThisNode, nCurrentLevel)
    {
        //console.debug("TreeFirstWalk(%s,%d)", pThisNode.name, nCurrentLevel);
    
        /*------------------------------------------------------
         * In a first post-order walk, every node of the tree is
         * assigned a preliminary x-coordinate (held in field
         * node->flPrelim). In addition, internal nodes are
         * given modifiers, which will be used to move their
         * children to the right (held in field
         * node->flModifier).
         * Returns: TRUE if no errors, otherwise returns FALSE.
         *----------------------------------------------------*/
    
        var pLeftmost;            /* left- & rightmost */
        var pRightmost;           /* children of a node. */
        var flMidpoint;           /* midpoint between left- */
        /* & rightmost children */
    
        /* Set up the pointer to previous node at this level */
        pThisNode.prev = this.prevAtLevel[nCurrentLevel] || null;
    
        this.prevAtLevel[nCurrentLevel] = pThisNode;
        
        /** determine max level height */
        var name;
        switch (this.options.ROOT_ORIENTATION) 
        {
           case "NORTH":
           case "SOUTH":
               name = "NODE_HEIGHT";
               break;
           case "EAST":
           case "WEST":
               name = "NODE_WIDTH";
              break;
        }
    
        var h = this.getConfigValue(name, pThisNode);
        this.levelHeight[nCurrentLevel] = Math.max(h + this.options.LEVEL_GAP, this.levelHeight[nCurrentLevel] || 0);
        //console.debug("level %s: h is %s, this.levelHeight = %o", nCurrentLevel, h, this.levelHeight);
        
    
        /* Clean up old values in a node's flModifier */
        pThisNode.flModifier = 0;
    
        if (!pThisNode.offspring || nCurrentLevel == this.options.MAXIMUM_DEPTH) 
        {
            if (pThisNode.leftsibling) 
            {
                /*--------------------------------------------
                 * Determine the preliminary x-coordinate
                 *   based on:
                 * - preliminary x-coordinate of left sibling,
                 * - the separation between sibling nodes, and
                 * - mean width of left sibling & current node.
                 *--------------------------------------------*/
                /* Set the mean width of these two nodes */
                this._meanNodeSize(pThisNode.leftsibling, pThisNode);
                pThisNode.flPrelim = pThisNode.leftsibling.flPrelim + this.options.SIBLING_SEPARATION + this.flMeanWidth;
            }
            else
            {
                /* no sibling on the left to worry about */
                pThisNode.flPrelim = 0;
            }
        }
        else 
        {
            /* Position the leftmost of the children */
            if (this._firstWalk(pLeftmost = pRightmost = pThisNode.offspring, nCurrentLevel + 1)) 
            {
                /* Position each of its siblings to its right */
                while (pRightmost.rightsibling) 
                {
                    if (!this._firstWalk(pRightmost = pRightmost.rightsibling, nCurrentLevel + 1)) 
                    {
                        return false;
                    }
                }
    
    
                /* Calculate the preliminary value between */
                /* the children at the far left and right */
                flMidpoint = (pLeftmost.flPrelim + pRightmost.flPrelim)/ 2;
    
                /* Set global mean width of these two nodes */ 
                this._meanNodeSize(pThisNode.leftsibling, pThisNode);
    
                if (pThisNode.leftsibling) 
                {
                    pThisNode.flPrelim = pThisNode.leftsibling.flPrelim + this.options.SIBLING_SEPARATION + this.flMeanWidth;
                    pThisNode.flModifier = pThisNode.flPrelim - flMidpoint;
    
                    this._apportion(pThisNode, nCurrentLevel);
                }
                else
                {
                    pThisNode.flPrelim = flMidpoint;
                }
            }
            else
            {
                return false; /* Couldn't get an element */
            }
        }
        return true;
    },
_secondWalk:    
    function(pThisNode, nCurrentLevel, curHeight)
    {
        //console.debug("TreeSecondWalk(%s,%d)", pThisNode.name, nCurrentLevel);
        
       /*------------------------------------------------------
        * During a second pre-order walk, each node is given a
        * final x-coordinate by summing its preliminary
        * x-coordinate and the modifiers of all the node's
        * ancestors.  The y-coordinate depends on the height of
        * the tree.  (The roles of x and y are reversed for
        * RootOrientations of EAST or WEST.)
        * Returns: TRUE if no errors, otherwise returns FALSE.
        *----------------------------------------- ----------*/
    
       var bResult = true;        /* assume innocent        */
       var lxTemp, lyTemp;        /* hold calculations here */
       var flNewModsum;          /* local modifier value   */
    

       
       if (nCurrentLevel <= this.options.MAXIMUM_DEPTH) 
       {
          flNewModsum = this.flModsum;  /* Save the current value  */
          switch (this.options.ROOT_ORIENTATION) 
          {
             case "NORTH":
                lxTemp = this.xTopAdjustment + (pThisNode.flPrelim + this.flModsum);
                lyTemp = this.yTopAdjustment + curHeight;
                break;
             case "SOUTH":
                lxTemp = this.xTopAdjustment + (pThisNode.flPrelim + this.flModsum);
                lyTemp = this.yTopAdjustment - curHeight;
                break;
             case "EAST":
                 lxTemp = this.xTopAdjustment - curHeight;
                 lyTemp = this.yTopAdjustment - (pThisNode.flPrelim + this.flModsum);
                break;
             case "WEST":
                 lxTemp = this.xTopAdjustment + curHeight;
                 lyTemp = this.yTopAdjustment - (pThisNode.flPrelim + this.flModsum);
                break;
          }
    
         /* The values are within the allowable range */
         lxTemp = lxTemp | 0;
         lyTemp = lyTemp | 0;
          
         pThisNode.xCoordinate = lxTemp;
         pThisNode.yCoordinate = lyTemp;
         
         this.aabb.add(lxTemp, lyTemp);
         this.aabb.add(lxTemp + this.getConfigValue("NODE_WIDTH", pThisNode), lyTemp + this.getConfigValue("NODE_HEIGHT", pThisNode));
             
         if (pThisNode.offspring) 
         {
            /* Apply the flModifier value for this    */
            /* node to all its offspring.             */
            this.flModsum = flNewModsum = flNewModsum + pThisNode.flModifier;
            
            bResult = this._secondWalk( pThisNode.offspring, nCurrentLevel + 1, curHeight + this.levelHeight[nCurrentLevel]);
            flNewModsum = flNewModsum - pThisNode.flModifier;
         }
    
         if (pThisNode.rightsibling && bResult) 
         {
            this.flModsum = flNewModsum;
            bResult = this._secondWalk( pThisNode.rightsibling, nCurrentLevel, curHeight);
         }
       }
       return bResult;
    },
layout:    
    function(pApexNode)
    {
        /*------------------------------------------------------
         * Determine the coordinates for each node in a tree.
         * Input: Pointer to the apex node of the tree
         * Assumption: The x & y coordinates of the apex node
         * are already correct, since the tree underneath it
         * will be positioned with respect to those coordinates.
         * Returns: TRUE if no errors, otherwise returns FALSE.
         *----------------------------------------------------*/

        this.prevAtLevel = [];
        this.levelHeight = [];

        this.flModsum = 0;

        if (pApexNode) 
        {
            /* Generate the properly-placed tree nodes.      */
            /* TreeFirstWalk: a post-order walk              */
            /* TreeSecondWalk: a pre-order walk              */
            if (this._firstWalk(pApexNode, 0)) 
            {
                /* Determine how to adjust the nodes with     */
                /* respect to the location of the apex of the */
                /* tree being positioned.                     */
                switch (this.options.ROOT_ORIENTATION) 
                {
                case "NORTH":
                case "SOUTH":
                    /* Create the adjustment from x-coord  */
                    this.xTopAdjustment = pApexNode.xCoordinate - pApexNode.flPrelim;
                    this.yTopAdjustment = pApexNode.yCoordinate;
                    break;
                case "EAST":
                case "WEST":
                    /* Create the adjustment from y-coord  */
                    this.xTopAdjustment = pApexNode.xCoordinate;
                    this.yTopAdjustment = pApexNode.yCoordinate + pApexNode.flPrelim;
                    break;
                }
                
                
                return this._secondWalk(pApexNode, 0, 0);
            }
            else
            {
                return false; /*  Couldn't get an element   */
            }
        }
        else
        {
            return true; /*  Easy: null pointer was passed  */
        }
    }
};


var treeLayout  = {
    TreeLayout: TreeLayout,
    TreeLayoutNode: TreeLayoutNode,
    blacklist: blacklist
};

window.treeLayout = treeLayout;

module.exports = treeLayout;
