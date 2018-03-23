//+++++++++++++++++++++++++++
//Author: Thomas Androxman
//Date  : Dec/2017
//+++++++++++++++++++++++++++
//Contains:
//DependsOn: BasicLib.js

//Global Functions-----------------------------------------------------------------------------------------------------------------------------------

//===================================================================================================================================================
//Classes / Constructor-functions
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeNode (newData)
{   //This is a generic object used in various graph data structures (linked lists, heaps, reb black trees, Prim, Dijkstra, etc)
    
    //PRIVATE properties
    var data = newData;      //This can be anything.
    var auxVar;              //An auxiliary variable for miscellaneous uses
    var edgesArr = [];       //Array of references to other nodes
    var edgesWeightArr = []; //If the edges have weights, those weight values are stored here

    //PUBLIC Methods
    this.DeleteEdges   = function ()            {edgesArr=[]; return this;}
    this.PushEdge      = function (newEdge)     {if (newNode!==void(0) && !(newNode instanceof TypeNode)) {return;} edgesArr.push(newNode); return this;}
    this.PopEdge       = function ()            {return edgesArr.pop();}
    
    this.GetEdge       = function (idx)         {return edgesArr[idx];}
    this.GetEdgeWeight = function (idx)         {return edgesWeightArrArr[idx];}
    this.GetData       = function ()            {return data;}
    this.GetAuxVar     = function ()            {return auxVar;}
    this.GetEdgeCount  = function ()            {return edgesArr.length;}
    this.GetCopy       = function ()            {return new TypeNode(data);} //Shallow copy of the node  
    
    this.SetEdge       = function (idx,newNode) {if (newNode!==void(0) && !(newNode instanceof TypeNode)) {return;} edgesArr[idx]=newNode;}
    this.SetEdgeWeight = function (idx,weight)  {edgesWeightArr[idx]=weight;}
    this.SetData       = function (newData)     {data = newData;}
    this.SetAuxVar     = function (something)   {auxVar = something;}
    this.SetEqualTo    = function (otherNode)
    {
        if (!(otherNode instanceof TypeNode)) {return;}
        data     = otherNode.GetData();
        edgesArr = [];
        
        var otherEdgeCount = otherNode.GetEdgeCount(); 
        for (let i=0; i<otherEdgeCount; i++) {edgesArr[i] = otherNode.GetEdge(i); }
    }
    this.toString     = function ()
    {
        var result  = '[Object TypeNode]\n';
            result += '------------------------->>\n'
            result += 'Node Data       = '+data+'\n';
            result += 'Node Edge Count = '+edgesArr.length+'\n';
            result += '<<-------------------------'
        return result;
    }
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeEdge (n1,n2,w)
{   //This object is used mainly when we want to explicitly declare edges (outside of the node object)
    //Note:The TypeEdge object is not restricted to only TypeNode objects. Anything goes.
    
    //Private properties
    var nodeA;
    var nodeB;
    var weight;
    
    //Private methods
    var Initialize = function (n1,n2,w)
    {
        if (n1===void(0) || n2===void(0)) {return;}
        
        nodeA  = n1;
        nodeB  = n2;
        weight = w;
    }
    
    //Public methods
    this.GetNodeA  = function () {return nodeA;}
    this.GetNodeB  = function () {return nodeB;}
    this.GetWeight = function () {return weight;}
    
    this.SetNodeA  = function (newNode) {nodeA=newNode;}
    this.SetNodeB  = function (newNode) {nodeB=newNode;}
    this.SetWeight = function ()        {weight = w;}
    
    this.toString  = function ()
    {
        var result  = '[Object TypeEdge]\n';
            result += 'NodeA  :'+nodeA+'\n'
            result += 'NodeB  :'+nodeB+'\n'
            result += 'Weight :'+weight;
        return result;
    }
    
    //Initialzation
    Initialize(e1,e2,w);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeLinkedList (sourceList,idx1,idx2,deleteFromSource)
{   //Double linked list with bookmark
    
    //PRIVATE properties
    var size;      //The size of the linked list
    var bookmark;  //The last accessed node
    
    var startNode; //The beginning node of the list
    var endNode;   //The ending node of the list
    
    //PRIVATE methods
    var Initialize     = function (sourceList,idx1,idx2,deleteFromSource)
    {
        size = 0;
        bookmark = {index:void(0), node:void(0)};
        startNode = endNode = void(0);
        
        //Handle optional arguments
        Populate (sourceList,idx1,idx2,deleteFromSource);
    }
    var CleanRangeVal  = function (idx1,idx2,length)
    {
        var result = {index1:idx1,index2:idx2};
        
        if (length<=0) {return;} //Trivial case
        if (idx1===void(0) && idx2===void(0)) {result.index1=0; result.index2=length-1; return result;} else if (isNaN(idx1)) {return;} 
        if (idx1<0 || idx1>length-1) {Say('WARNING: (CheckRangeVal) Start index is out of range',-1); return;} //idx1 should not be as tolerant as idx2
        if (isNaN(idx2) || idx2<idx1) {result.index2 = idx1;} else if (idx2>=length) {result.index2=length-1;} //Clip the ending index.

        return result;
    }
    var Populate       = function (sourceList,idx1,idx2,deleteFromSource)
    {   //Helper method that adds initial nodes into the list
    
        //Argument gate
        var sourceListSize=0;
        if (!(sourceList instanceof TypeLinkedList)) {return;}  else {sourceListSize = sourceList.Length();} if (sourceListSize==0) {return;}
        var cleanIdx = CleanRangeVal(idx1,idx2,sourceListSize);
        if (!cleanIdx) {return;} else {idx1 = cleanIdx.index1; idx2 = cleanIdx.index2;}    
        
        //Update the size of the new list
        size = idx2 - idx1 + 1;

        if (deleteFromSource)
        {
            let deletedSequence = sourceList.Delete(idx1,idx2);
            startNode = deletedSequence.startNode;
            endNode   = deletedSequence.endNode;
            bookmark.node  = startNode;
            bookmark.index = 0;
            return;
        }
        
        //Shallow-copy nodes from source list
        var newSeqStart;
        var newSeqEnd;
        for (let i=idx1; i<=idx2; i++)
        {
            let clonedNode = new TypeNode(sourceList.Get(i));
            
            if (i==idx1) {newSeqStart = newSeqEnd = clonedNode; continue;}
            clonedNode.SetEdge(0,newSeqEnd);
            newSeqEnd.SetEdge(1,clonedNode);
            newSeqEnd  = clonedNode;
        }
        startNode      = newSeqStart;
        endNode        = newSeqEnd;
        bookmark.node  = newSeqStart;
        bookmark.index = 0;
    }
    var MoveBookmarkTo = function (idx) 
    {   //Positions the bookmark onto the specified node
        //Note: When the list is not empty, the bookmark.node object is guaranteed to be initialized
        
        //Argument gate
        if (size==0) {return;} //Nothing to do
        if (idx<0) {idx=0;} else if (idx>=size) {idx=size-1;} //clip the idx to the list's current range
        
        //Determine if either of the list ends is closer than the bookmark
        var travelDelta = idx - bookmark.index; //Distance the bookmark will have to travel
        if      (idx==0      ||          idx<Math.abs(travelDelta)) {bookmark.index=0;      bookmark.node=startNode; travelDelta=idx;}          //start is closer than the bookmark was
        else if (idx==size-1 || (size-1-idx)<Math.abs(travelDelta)) {bookmark.index=size-1; bookmark.node=endNode;   travelDelta=idx-(size-1);} //end is closer than the bookmark was
        
        //Trivial case
        if (idx==bookmark.index) {return bookmark.node;}  //Testing idx after clipping and after adjusting for proximity to ends    
        
        //Position the bookmark
        var count     = Math.abs(travelDelta); 
        for (let i=0; i<count; i++)
        {   //walk the list to the new spot
            if (travelDelta<0) {bookmark.node = bookmark.node.GetEdge(0); bookmark.index --;} 
            else               {bookmark.node = bookmark.node.GetEdge(1); bookmark.index ++;}
        } 
        return bookmark.node; 
    }
    var MergeSort    = function (compFunction)
    {   //Bottom-up, in-place, iterative (no recursion) merge sort
        //Note: Avoid recursion to prevent issues with stack depth
        
        //Start (at the bottom) as if the list is subdivied in parts of 1-element wide
        //Progressively merge adjacent segments
        var levels = Math.log2(size); //The number of times the list can be divided by two
        if (Math.floor(levels)<levels) {levels = Math.floor(levels);}
    
        for (let i=0; i<=levels; i++)
        {   //Walk through each level
            let segmentWidth = Math.pow(2,i);
            let segmentPair  = segmentWidth * 2;
            for (let j=0; j<size; j+=segmentPair)
            {   //Walk through all segment pairs on this level
                let idx2 = j+segmentWidth; if (idx2>size-1) {continue;}
                let idx3 = j+2*segmentWidth-1; if (idx3>size-1) {idx3=size-1;}
                MergeTwoSortedSegments(j,idx2,idx3,compFunction);
            }
        }
    }
    var MergeTwoSortedSegments = function (idx1,idx2,idx3,compFunction)
    {   //Merge two contiguous sorted segments of the list in a sorted way
        
        if (idx1==idx2 && idx1==idx3) {return;} //Trivial case
        
        //Put a finger on idx1 and a finger on idx2 
        //Note: finger1 and finger2 have the node reference in them in order to avoid using the bookmark (bouncing back and forth in the list during the operation)
        var finger1 = {node:MoveBookmarkTo(idx1), index:idx1};
        var finger2 = {node:MoveBookmarkTo(idx2), index:idx2};

        //Compare the two values at fingers
        //Move the smaller value of the two behind the node initially at idx1
        while (finger1.index<idx2 && finger2.index<=idx3) //Stop if either segment runs out
        {
            let comparison = (compFunction)? compFunction(finger1.node.GetData(),finger2.node.GetData()) : finger1.node.GetData() - finger2.node.GetData();
            if (comparison<0) {finger1.node = finger1.node.GetEdge(1); finger1.index++; continue;}
            
            //Transfer node at finger2 behind finger1
            let thisNode   = finger2.node;            //This node is about to move
            finger2.node   = finger2.node.GetEdge(1); //Move finger2 to the next node
            finger2.index++;                          //Advance finger2 index (it moved up by one)
            finger1.index++;                          //A node will be placed behind finger 1, so finger1.index needs to advance by one (the node is the same)
            idx2++;                                   //The start index of segment two (idx2) has moved up by one as well (by placing a node behinf finger1)
            //Keep the bookmark at finger2
            bookmark.node  = (finger2.node)? finger2.node  : finger1.node;
            bookmark.index = (finger2.node)? finger2.index : finger1.index;
            MoveNode (thisNode,finger1.node);
        }
    }
    var MoveNode    = function (thisNode, destination, isAfter)
    {   //Moves a node (not an index) from its current position on the list to before(or after) the destination node
        
        //Note: Moving only one node necessitates rewiring 
        //Note: This is not a swap. A swap could be accomplished using two moves.
        //Note: Moving nodes around to accomplish a swap would be inefficient due to the amound of rewiring, where simply swapping the data property alone would do (leaving the nodes in place)
        
        if (thisNode == destination) {return;} //Trivial case.
        
        //Detach node from its current spot
        var prevNd = thisNode.GetEdge(0);
        var nextNd = thisNode.GetEdge(1);
        if (prevNd) {prevNd.SetEdge(1,nextNd);} else {startNode = nextNd;}
        if (nextNd) {nextNd.SetEdge(0,prevNd);} else {endNode   = prevNd;}

        //Attach the node to the new location
        prevNd = (isAfter)? destination : destination.GetEdge(0);
        nextNd = (isAfter)? destination.GetEdge(1) : destination;
        thisNode.SetEdge(0,prevNd); thisNode.SetEdge(1,nextNd);
        if (prevNd) {prevNd.SetEdge(1,thisNode);} else {startNode = thisNode;}
        if (nextNd) {nextNd.SetEdge(0,thisNode);} else {endNode   = thisNode;}
    }
    var Find        = function (thisThing,asData)
    {   //thisThing is either data inside some node or a node object 
        //find thisThing in the list and return the bookmark
        
        //Argument gate
        if (thisThing===void(0)) {return;}
        
        var resultIdx;
        var isNode = (thisThing instanceof TypeNode)? true : false;
        
        for (let i=0; i<size; i++)
        {
            MoveBookmarkTo(i);
            if ( isNode && ((asData===void(0) && (bookmark.node==thisThing || bookmark.node.GetData()==thisThing)) ||
                            (asData== false   &&  bookmark.node==thisThing) || 
                            (asData== true    &&  bookmark.node.GetData()==thisThing) ) ||
                !isNode && bookmark.node.GetData()==thisThing) {resultIdx = bookmark; break;}
        }
        return resultIdx;
        
    }
    
    //PUBLIC methods
    this.Length     = function ()                  {return size;}
    this.Clear      = function ()                  {this.Delete();}                      //Synonym for Delete() without arguments; empties the entire list
    this.Push       = function (item,asData,i,j)   {this.Insert(item,size,asData,i,j);}  //Synonym for PushBack
    this.PushBack   = function (item,asData,i,j)   {this.Insert(item,size,asData,i,j);}  //if the item is another list, then 'i' to 'j' is the location of the node sequence in that other list
    this.PushFront  = function (item,asData,i,j)   {this.Insert(item,0,asData,i,j);}
    this.Pop        = function ()                  {return this.Delete(size-1);}         //Synonym for PopBack
    this.PopBack    = function ()                  {return this.Delete(size-1);}
    this.PopFront   = function ()                  {return this.Delete(0);}
    this.Sort       = function (compFunction)      {MergeSort(compFunction);}
    this.Reverse    = function ()                  
    {   //Reverse the order of the list, by flipping the edges and swaping end and start node references
    
        //Note: It is tempting to leave the list as is and flip the interpretation of left and right (apparent reverse)
        //Caution: An apparent reversing is possible up to a point and fails when inserting/splicing other lists (of different alignment) into this list
        //Caution: Nodes edges must always be constracted according to a global standard direction (cannot have nodes with conflicting edge interpretation left/right)
        
        if (size<=1) {return;}    //Trivial case
        
        //Flip node edges
        var currNode = startNode; //Set the starting point
        for (let i=0; i<size; i++)
        {   //Walk through all list elements
    
            //Swap edges of the current node
            temp = currNode.GetEdge(0);
            currNode.SetEdge(0,currNode.GetEdge(1));
            currNode.SetEdge(1, temp);
            
            //The next node is now on the '0' (left) edge
            currNode = currNode.GetEdge(0);
        }
        
        //Swap Start and End node references
        var temp = startNode; startNode=endNode; endNode=temp;
        
        //Adjust the bookmark index
        bookmark.index = size-1 - bookmark.index;
    }
    this.Insert     = function (newThing,idx,asData,sourceIdx1,sourceIdx2) 
    {   //Add newThing into the list
        //args: newThing may be a value, or a node, or a list
        //args: when newThing is a list then sourceIdx1 and sourceIdx2 are used to define a range in the source
       
        //Argument gate
        if (idx===void(0)) {idx=size;} else if (isNaN(idx)) {Say('WARNING: (Insert) Did not receive a numeric index',-1); return;}
        //Check if newThing is another list
        var insList   = (newThing instanceof TypeLinkedList && !asData)? true : false; if (insList && newThing.Length()==0) {return;}
        var listSeq   = (insList)? newThing.Delete(sourceIdx1,sourceIdx2) : void(0);
        var newNode   = (insList)? listSeq.startNode : (newThing instanceof TypeNode && !asData)? new TypeNode(newThing.GetData()) : (asData===void(0) || asData==true)? new TypeNode(newThing) : void(0); 
        
        if (!newNode) {Say('WARNING: (Insert) Was asked to splice, but did not receive a node or a list object to insert',-1); return;} 
        if (!insList && (newNode.GetEdge(0) || newNode.GetEdge(1))) {Say('WARNING: (Insert) The node received belongs to another list (must delete from the other list first)',-1); return;}
        
        //Position the bookmark
        MoveBookmarkTo(idx);  
        
        //The very first thing (node or list)
        if (!bookmark.node) {startNode = bookmark.node = newNode; bookmark.index=0; if (insList){endNode = listSeq.endNode; size=listSeq.length;} else {endNode = startNode; size=1;} return;}
        
        //STITCH a new node
        //Note: When a list is inserted, the orginal list must be cleared (after its nodes are spliced in) otherwise any updates on one list would break the logistics of the other
        var prevNode = (idx<size)? bookmark.node.GetEdge(0) : bookmark.node;
        
        //Left edge of new node
        newNode.SetEdge(0,prevNode);                 //Attach new node's left arm to the previous node
        if (prevNode) {prevNode.SetEdge(1,newNode);} //Attach previous node's right arm to the new node
        else {startNode=newNode;}                    //New node is at the front. Update the startNode
    
        //Right edge of new node (or list)
        if (insList) 
        {   //Attach right edge of the list
            if(idx<size) {listSeq.endNode.SetEdge(1,bookmark.node); bookmark.node.SetEdge(0,listSeq.endNode); bookmark.index += listSeq.length-1;} else {endNode=listSeq.endNode; bookmark.index += listSeq.length;}
            bookmark.node = listSeq.endNode; //Update bookmark node
            size+=listSeq.length;            //Update the size of the list
        } 
        else 
        {   //Attach right edge of new node
            if (idx<size) {newNode.SetEdge(1,bookmark.node); bookmark.node.SetEdge(0,newNode);} else {endNode=newNode; bookmark.index++;} 
            bookmark.node = newNode;      //Update bookmark node
            size++;                       //Update the size of the list
        }
    } 
    this.Delete     = function (startIdx,endIdx,returnDeletedAsList) 
    {   //Delete nodes from startIdx to endIdx
        //Returns the deleted part as a new list (if returnDeletedAsList==true), otherwise void(0)

        //Argument gate
        if (returnDeletedAsList) {return new TypeLinkedList(this,startIdx,endIdx,true);} 
        var sequence = {startNode:void(0),endNode:void(0),length:0};
        var cleanIdx = CleanRangeVal(startIdx,endIdx,size);
        if (!cleanIdx) {return;} else {startIdx = cleanIdx.index1; endIdx = cleanIdx.index2;}
        if (startIdx==0 && endIdx==size-1) {sequence.startNode = startNode; sequence.endNode = endNode; sequence.length = size; Initialize(); return sequence;} //Trivial case

        //Define node sequence
        sequence.startNode  = MoveBookmarkTo(startIdx);
        sequence.endNode    = MoveBookmarkTo(endIdx);
        sequence.length     =  endIdx - startIdx +1;
        var prevNode    = sequence.startNode.GetEdge(0); 
        var nextNode    = sequence.endNode.GetEdge(1);
        
        //Detach sequence from list
        sequence.startNode.SetEdge(0,void(0));
        sequence.endNode.SetEdge(1,void(0));
        size -= sequence.length;

        //Heal the list
        if (!prevNode && !nextNode) {Initialize();}
        if ( prevNode && !nextNode) {prevNode.SetEdge(1,nextNode); endNode=prevNode;   bookmark.node=prevNode; bookmark.index=size-1;}
        if (!prevNode &&  nextNode) {nextNode.SetEdge(0,prevNode); startNode=nextNode; bookmark.node=nextNode; bookmark.index=0;}
        if ( prevNode &&  nextNode) {prevNode.SetEdge(1,nextNode); nextNode.SetEdge(0,prevNode); bookmark.node=nextNode;}
        
        //Return the detached sequence of nodes
        //Note: This return can only be used by TypeLinkedList methods only (to ensure integrity there should be no client methods allowing it as input)
        return sequence;
    }
    this.DeleteData = function (thisData)        {return this.Delete(this.GetIndexOf(thisData,true));}
    this.Cut        = function (startIdx,endIdx) {return this.Delete(startIdx,endIdx,true);}
    this.Paste      = function (otherList,atIdx) {this.Insert(otherList,atIdx);} 
    this.Move       = function (idx1,idx2,isAfter)
    {   //Move a node from idx1 to idx2.
        //By default the insertion is *at* idx2 which means whatever node was there will move one index up 
        //When isAfter==true, the insertion happens after the node at idx2

        if (isNaN(idx1) || isNaN(idx2)) {Say('WARNING: (Move) Did not receive a target or destination index',-1); return;} 
        if (size<=1) {return;} //Trivial case
        
        //Note: (idx1 and idx2 start different, but might resolve to the same node after clipping; the MoveBookmark() does clipping of idx1 and idx2)
        var thisNode    = MoveBookmarkTo(idx1);
        var destination = MoveBookmarkTo(idx2);

        MoveNode (thisNode, destination, (idx2>=size || isAfter)?true:false);
        
        //Update the bookmark
        //Note: The bookmark points to the final insertion point
        //Note: The bookmark.index needs to be adjusted by one in some cases
        bookmark.node  = thisNode; 
        bookmark.index = (!isAfter && idx1<idx2)? bookmark.index-1 : ( isAfter && idx1>idx2)? bookmark.index+1 : bookmark.index;
    }
    

    this.Get        = function (idx)          {return (idx>=0 && idx<size)? MoveBookmarkTo(idx).GetData() : void(0);} //return the data of the node at index
    this.GetBack    = function ()             {return this.Get(size-1);}
    this.GetFront   = function ()             {return this.Get(0);}
    this.GetCopy    = function (idx1,idx2)    {return new TypeLinkedList(this,idx1,idx2); }
    this.GetIndexOf = function (query,asData) {var result = Find(query, asData); return (result)? result.index : void(0); }
 
    this.toString   = function ()
    {
        var currNode = startNode;
        var result  = '[Object TypeLinkedList]\n';
            result += 'Length         = '+size+'\n';
            result += 'Bookmark index = '+bookmark.index+'\n';
            result += 'Bookmark node -->'+bookmark.node+'\n';
            result += 'Start node    -->'+startNode+'\n';
            result += 'End node      -->'+endNode+'\n';
            result += 'Data          -->\n'; for (let i=0; i<size; i++){result+=currNode.GetData()+((i<size-1)?', ':'\n'); currNode = currNode.GetEdge(1);}
            result += '====================================';
        return result;
    }
    
    //Initialization
    Initialize(sourceList,idx1,idx2,deleteFromSource);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeDelaunayTriangulation (sourceBoundary) //To DO... this object is incomplete
{   //Triangulate a planar closed curve
    //Note: In the future this shouls handle 3D meshing and should receive a construction array of how the surface is made
    
    //Note: There are two steps involved. 
    //Note: Step 1 - Delaunay constrained triangulation. (subdivide a starting global triangle by introducing points from a vertex set one by one and performing Delaunay tests on each insertion)
    //Note: Step 2 - Refinement, by adding stainer points on boundary edges (by diametral circle test) and adding circumcenter points on bad triangles
    
    //Private properties
    var sourceCurve;            //A TypeCurve object (closed planar curve)
    var sourcePlane;            //The plane the source curve is on
    var sourceComputedVertices; //The vertices of the boundary
    var trianglesTree;          //A tree of TypeNode nodes representing the triangulation history. Each node represents a triangle (three points in an array) and has 2 or 3 edges representing triangle subdivisions
    
    //Private methods
    var Initialize = function (sourceBoundary)
    {
        //Argumant gate
        if (!(sourceBoundary instanceof TypeCurve)) {Say('WARNGING: (Initialize) The source boundary must be a TypeCurve object'); return;}
        if (!sourceBoundary.IsPlanar() || !sourceBoundary.IsClosed()) {Say('WARNGING: (Initialize) Did not receive a closed planar curve'); return;}

        //Establish references to the source object data
        sourceCurve            = sourceBoundary;
        sourcePlane            = sourceCurve.GetPlane();     //The plane on which the source curve is on
        sourceComputedVertices = sourceCurve.GetComputedVertArr(); //This may return void(0) if the curve is not a computed type
        if ((!sourceComputedVertices || sourceComputedVertices.length<3) && sourceCurve.GetVertexCount()<3) {return;} //Nothing to do
        
        //Add initial global triangle
        //Note: The global triangle is equilateral (an arbitrary initial choice) is on the same plane as and contains all vertices
        let sourcePlaneUnitU  = sourcePlane.GetUnitU();      //Unit vector in the U direction of the source plane
        let sourcePlaneUnitV  = sourcePlane.GetUnitV();      //Unit vector in the V direction of the source plane
        let sourceMinBoundPt  = sourcePlane.GetBoundMin();   //In world coords: The min point of the bounding rectangle of the source plane
        let sourceMaxBoundPt  = sourcePlane.GetBoundMax();   //In world coords: The max point of the bounding rectangle of the source plane
        let sourceRectDim     = sourcePlane.GetBoundUVdim(); //In UV coords: The width and height of the bounding rectangle on the plane of the source curve
        let baseUextention    = sourceRectDim.y / Math.tan(60*degToRad);     //In UV coords: The base of the global triangle extends so far from the base of the bounding rectangle
        let baseVextention    = sourceRectDim.x * Math.tan(60*degToRad) / 2; //In UV coords: The top of the global triangle extends so far from the top of the bounding rectangle
        //The triangle itself
        let globalTriangleLL  = sourceMinBoundPt.Plus(sourcePlaneUnitU.ScaleBy(-baseUextention));
        let globalTriangleLR  = sourceMinBoundPt.Plus(sourcePlaneUnitU.ScaleBy(sourceRectDim.x + baseUextention));
        let globalTriangleTop = sourceMaxBoundPt.Plus(sourcePlaneUnitU.ScaleBy(-sourceRectDim.x/2)).Plus(sourcePlaneUnitV.ScaleBy(baseVextention));
        
        //Assign the head node to the triangles tree
        //Note: The data of each tree node is an array of three vertices (defining the triangle) followed by three booleans indicating which edges are part of the original constraints
        //Note: The edges of each tree node point to 0, 2, 3, other triangle nodes
        trianglesTree         = new TypeNode(NewTriangle(globalTriangleLL,globalTriangleLR,globalTriangleTop,false,false,false)); //No need to define node edges (children nodes) yet
        
        FirstPassTriangulate(); //Perform a Constrained Delaunay triangulation
    }
    var NewTriangle           = function (v1,v2,v3,stEdge1,stEdge2,stEdge3) {return {vertex:[v1,v2,v3],isStaticEdge:[stEdge1,stEdge2,stEdge3]};} //Edges: v1v2, v2v3, v3v1
    var FirstPassTriangulate  = function ()
    {   //Perform a basic Delaunay on all input curve vertices
  
        var vertCount = (sourceComputedVertices)? sourceComputedVertices.length : sourceCurve.GetVertexCount();
        for (let i=0; i<vertCount; i++)
        {   //Walk through all vertices of the input curve
            let currVertex     = (sourceComputedVertices)? sourceComputedVertices[i] : sourceCurve.GetVertex(i);
            let prevVertex     = (sourceComputedVertices)? (i==0)? sourceComputedVertices[vertCount-1] : sourceComputedVertices[i-1] : (i==0)? sourceCurve.GetVertex(vertCount-1) : sourceCurve.GetVertex(i-1);
            let nextVertex     = (sourceComputedVertices)? (i==vertCount-1)? sourceComputedVertices[0] : sourceComputedVertices[i+1] : (i==vertCount-1)? sourceCurve.GetVertex(0) : sourceCurve.GetVertex(i+1);
            let parentTriangle = FindContainerTriangle(trianglesTree, currVertex); //A parent triangle is always guarenteed to exist
            let tVert1  = parentTriangle.GetData().vertex[0];
            let tVert2  = parentTriangle.GetData().vertex[1];
            let tVert3  = parentTriangle.GetData().vertex[2];
            if (currVertex.IsCollinear(tVert1,tVert2) || currVertex.IsCollinear(tVert2,tVert3) || currVertex.IsCollinear(tVert3,tVert1))
            {   //currVertex falls on the parent triangle edge
                
            }
            else
            {   //currVertex is fully inside the parent triangle
                //Add three children triangles
                
            }
        }
    }
    var FindContainerTriangle    = function (currentNode, newVertex)
    {   //Recursively follow the tree to find a leaf node that is the smallest possible parent triangle for the newVertex
        //Returns a TypeNode object
        var result;
        var currTriangle = currentNode.GetData();
        var v1 = currTriangle.vertex[0];
        var v2 = currTriangle.vertex[1];
        var v3 = currTriangle.vertex[2];
        var n  = sourcePlane.GetNormal();
        var test1 = newVertex.IsRightOf(v1,v2,n);
        var test2 = newVertex.IsRightOf(v2,v3,n);
        var test3 = newVertex.IsRightOf(v3,v1,n);
   
        if (test1===void(0) || test2===void(0) || test3===void(0) || (test1 && test2 && test3)) 
        {   //'newVertex' is within the boundary of this triangle
    
            //Try to see which child triangle also contains it
            //Note: Edge indices 4 and 5 are reserved to point back to the parent node(s)
            for (let i=0; i<3; i++)
            {   //Walk through each child (there can only at most four)
                let childNode = currentNode.GetEdge(i); 
                if (!childNode) {break;} //Each node has at most 3 children nodes
                
                result = FindContainerTriangle(childNode,newVertex); 
                if (result) {return result;}
            }
            result = currentNode; //Nothing smaller found (the original triangle is the smallest possible parent of the vertex)
        }
        return result;
    }
    
    //Public methods
    //To DO....
    
    //Initialization
    Initialize(sourceBoundary);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeHashGrid (subD, maxP, minP)
{   //An array of linked lists subdividing space into cells and putting data in those cells depending on location
    //This is used to speed up lookups in collisions detection, or in triangulations
    
    //Note: HashGrid benefits from linkedList in the event of continuously moving objects. It can handle repeated deletions and insertions from one cell to another as particles move.
    //Note: This object is not designed to handle resizing after initialization (the added compexity of allowing it is not worth it)
    //Note: Change of subdivisions or dimensions would require having all objects in the grid array added (inserted) in a new array from scratch
    
    //Private properties
    var defaultDim;       //Object {max:maxDimension, min:minDimension, span:measurements} --> Default values in case of bad argument input
    var population;       //Holds the total number of objects in all grids combined
    var gridBoundary;     //Object {max:maxDimension, min:minDimension, span:measurements}
    var gridSubdivisions; //A TypeXYZw holding the integer number of subdivions in each dimension
    var gridCellDim;      //A TypeXYZw holding the dimensions of a cell
    
    var coreGridArray;    //An array of all the grid cells (each cell will hold a linked list of data)

    //Private methods
    var Initialize = function (subD, maxP, minP)
    {
        population = 0;
        defaultDim = NewDimensions (new TypeXYZw(1,1,1), new TypeXYZw());
        
        //Argument gate
        if (!(subD  instanceof TypeXYZw)) {subD = new TypeXYZw(subD);}
        if (!(maxP  instanceof TypeXYZw)) {maxP = new TypeXYZw(maxP);}
        if (!(minP  instanceof TypeXYZw)) {minP = new TypeXYZw(minP);}
        if (minP.IsEqual(maxP)) {gridBoundary = defaultDim; Say('WARNING: (ChangeDimensions) The received max point is equal to the min point (defaults were applied; grid must have some size)',-1); return;}
        if (minP.x>maxP.x || minP.y>maxP.y || minP.z>maxP.z) {gridBoundary = defaultDim; Say('WARNING: (ChangeDimensions) All components of the min point must be smaller than the max point (defaults were applied; grid must have some size)',-1); return;}

        subD.x = (Number.isNaN(subD.x) || subD.x<1) ? 1 : Math.floor(subD.x);
        subD.y = (Number.isNaN(subD.y) || subD.y<1) ? 1 : Math.floor(subD.y);
        subD.z = (Number.isNaN(subD.z) || subD.z<1) ? 1 : Math.floor(subD.z);
        
        gridBoundary     = NewDimensions(maxP, minP);
        gridSubdivisions = subD; 
        gridCellDim      = new TypeXYZw(gridBoundary.span.x/gridSubdivisions.x, gridBoundary.span.y/gridSubdivisions.y, gridBoundary.span.z/gridSubdivisions.z);
        coreGridArray    = NewCoreArray();
    }
    var NewDimensions    = function (maxP,minP) {return {min:minP,max:maxP,span:maxP.Minus(minP)};}
    var NewCoreArray     = function ()
    {
        //Start the core array
        var newArr = new Array(gridSubdivisions.z); //A row of planes

        //Create linkedList objects for each cell
        for (let k=0; k<gridSubdivisions.z; k++) 
        {
            newArr[k] = new Array(gridSubdivisions.y);
            for (let j=0; j<gridSubdivisions.y; j++) 
            {
                newArr[k][j] = new Array(gridSubdivisions.x);
                for (let i=0; i<gridSubdivisions.x; i++) {newArr[k][j][i] = new TypeLinkedList();}
            }
        }

        return newArr; 
    }
    var CheckBounds      = function (testPos)
    {
        if (testPos.x<gridBoundary.min.x || testPos.y<gridBoundary.min.y || testPos.z<gridBoundary.min.z || 
            testPos.x>gridBoundary.max.x || testPos.y>gridBoundary.max.y || testPos.z>gridBoundary.max.z) {Say('WARNING: (CheckBounds) Out of bounds',-1); return false;}
        else {return true};
    }
    var GridCoordinates = function (wPos)
    {
        var delta  = wPos.Minus(gridBoundary.min);
        var gridX  = (wPos.x>=gridBoundary.max.x)? gridSubdivisions.x-1 : (wPos.x<=gridBoundary.min.x || gridCellDim.x<=0)? 0 : Math.floor(delta.x/gridCellDim.x); 
        var gridY  = (wPos.y>=gridBoundary.max.y)? gridSubdivisions.y-1 : (wPos.y<=gridBoundary.min.y || gridCellDim.y<=0)? 0 : Math.floor(delta.y/gridCellDim.y); 
        var gridZ  = (wPos.z>=gridBoundary.max.z)? gridSubdivisions.z-1 : (wPos.z<=gridBoundary.min.z || gridCellDim.z<=0)? 0 : Math.floor(delta.z/gridCellDim.z); 
        return new TypeXYZw(gridX, gridY, gridZ);
    }

    //Public methods
    this.Clear    = function () {population = 0; for (let k=0; k<gridSubdivisions.z; k++) {for (let j=0; j<gridSubdivisions.y; j++) {for (let i=0; i<gridSubdivisions.x; i++) {coreGridArray[k][j][i].Clear();}}}}
    this.Add      = function (data, worldPos)  
    {
        //Argument gate
        if (worldPos!==void(0) && !(worldPos instanceof TypeXYZw)) {worldPos = new TypeXYZw(worldPos);} //if 'worldPos' is something else (maybe an array) convert it to TypeXYZw
        if (worldPos===void(0) && data instanceof TypeXYZw) {worldPos = data;} //if 'data' can be interprested as a coordinate and there is no worldPos, use 'data'
        if (worldPos===void(0) || data===void(0)) {return;} //if there is still no worldPos (or no data), nothing to do

        //Get the grid coordinates of the worldPos and add the data into the grid
        var gridIdx = GridCoordinates (worldPos); 
        coreGridArray[gridIdx.z][gridIdx.y][gridIdx.x].Push(data); population++;
        return true;
    }
    this.Delete   = function (data, worldPos)  
    {
        //Argument gate
        if (worldPos!==void(0) && !(worldPos instanceof TypeXYZw)) {worldPos = new TypeXYZw(worldPos);} //if 'worldPos' is something else (maybe an array) convert it to TypeXYZw
        if (worldPos===void(0) && data instanceof TypeXYZw) {worldPos = data;} //if 'data' can be interprested as a coordinate and there is no worldPos, use 'data'
        if (worldPos===void(0) || data===void(0)) {return;} //if there is still no worldPos (or no data), nothing to do
        
        var gridIdx = GridCoordinates (worldPos);
        var deleted = coreGridArray[gridIdx.z][gridIdx.y][gridIdx.x].DeleteData(data); if (deleted) {population--;}
        return deleted; //Delete 'data' if found in the linked list
    }
    this.Move     = function (data, toWpos, fromWpos)
    {
        //Argument gate
        if (toWpos  !==void(0) && !(toWpos   instanceof TypeXYZw)) {toWpos   = new TypeXYZw(toWpos);}   //Type conversion attempt
        if (fromWpos!==void(0) && !(fromWpos instanceof TypeXYZw)) {fromWpos = new TypeXYZw(fromWpos);} //Type conversion attempt
        if (fromWpos===void(0) && data instanceof TypeXYZw) {fromWpos = data;}
        if (fromWpos===void(0) || toWpos===void(0) || data===void(0)) {return;} //nothing to do
        
        //Insert     = function (newThing,idx,asData,sourceIdx1,sourceIdx2)
        var fromGridIdx   = GridCoordinates (fromWpos);
        var toGridIdx     = GridCoordinates (toWpos);
        var sourceList    = coreGridArray[fromGridIdx.z][fromGridIdx.y][fromGridIdx.x];
        var sourceListIdx = sourceList.GetIndexOf(data); if (!sourceListIdx) {return;}
        
        //Transfer a node from one list to another
        //Note: The node is deleted at the source list and spliced into the destination list
        coreGridArray[toGridIdx.z][toGridIdx.y][toGridIdx.x].Push(sourceList,false,sourceListIdx);
    } 
    
    this.GetCount     = function (coord, asGridCoord) 
    {
        if (coord === void(0) ) {return population;}
        if (!(coord instanceof TypeXYZw)) {coord = new TypeXYZw(coord);}
        
        var gridIdx = (asGridCoord == true)? coord : GridCoordinates (coord); 
        return  coreGridArray[gridIdx.z][gridIdx.y][gridIdx.x].Length(); 
    }
    this.GetGridCoord = function (worldPos) {return GridCoordinates(worldPos);}
    this.toString     = function ()
    {
        var result  = '[Object TypeHashGrid]\n';
            result += 'Population   : '+population+'\n';
            result += 'Subdivisions : <X = '+gridSubdivisions.x+'>, <Y = '+gridSubdivisions.y+'>, <Z = '+gridSubdivisions.z+'>\n';
            result += 'Dimensions   : <Width = '+gridBoundary.span.x+'>, <Height = '+gridBoundary.span.y+'>, <Depth = '+gridBoundary.span.z+'>\n';
            result += 'Min point    : '+gridBoundary.min+'\n';
            result += 'Max point    : '+gridBoundary.max+'\n';
            result += 'Grid Cell    : <Width = '+gridCellDim.x+'>, <Height = '+gridCellDim.y+'>, <Depth = '+gridCellDim.z+'>';
        return result;
    }
    //Initialization
    Initialize(subD, maxP, minP);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypePriorityQueue (isMax, compareFunction)
{   //A Heap object (implemented as an array) which is acting as a priority queue
    
    //Private properties
    var heapArr;    //Array: The heap is stored in this array
    var compFunct;  //Reference to a function: if present this will be used for comparisons between heap items
    var isMaxHeap;  //Boolean
    
    //Private methods
    var Initialize = function (isMax, compareFunction)
    {
        heapArr   = [];
        isMaxHeap = (isMax==true)? true : false;
        compFunct = compareFunction;
    }
    var Compare   = function (a, b) {return (compFunct)? compFunct(a,b) : (a==b)? 0 : (a>b)? 1 : -1;} //Can also handle strings
    var BuildHeap = function () 
    {   //We can use the Heapify method in a bottom-up manner to convert an array into a max(min) heap
        
        //Note: the parent of element heapArr[length-1] is at heapArr[length/2-1]
		//Note: so all elements from 0 to length/2 -1 need to be checked from the bottom up
        var heapLen = heapArr.length; if (heapLen==0) {return;} 
        var fromIdx = Math.floor(heapLen/2);
        for (let i=fromIdx; i>=0; i--) {Heapify(i);}
    }
    var Heapify = function (startIdx,endIdx) 
    {   //HEAPIFY assumes that the binary trees rooted at LEFT(i) and RIGHT(i) are max (or min) heaps, but that A[i] might be smaller than its children, thus violating the max(min) heap property. 
        //HEAPIFY lets the value at A[i] “ﬂoat down” in the max(min) heap so that the subtree rooted at index i obeys the max(min) heap property.

        var lastIdx    = (endIdx!==void(0))? endIdx : heapArr.length-1; 
        var lastParent = Math.floor((lastIdx-1)/2);
        var flip       = (isMaxHeap)? 1 : -1;
        
        if(startIdx===void(0) || startIdx<0) {startIdx=0;} 
        
        while (startIdx<=lastIdx)
        {
            let choiceIdx = startIdx;           //Holds the index with the largest item (left or right)
            let leftIdx   = (startIdx+1)*2 - 1; //Start of the left tree in the array
            let rightIdx  = (startIdx+1)*2;     //Start of the right tree in the array

            //essentially we are going to compare three elements and choose the index of the largest/smallest element
            if (leftIdx>lastIdx) {break;}     //The last row may be incomplete (say half way) so if there is no leftIdx, then there is no rightIdx either and we have nothing to do
            if (rightIdx<=lastIdx && Compare(heapArr[rightIdx],heapArr[choiceIdx])*flip>0) {choiceIdx=rightIdx;} //Compare parent to right
            if (leftIdx <=lastIdx && Compare(heapArr[ leftIdx],heapArr[choiceIdx])*flip>0) {choiceIdx=leftIdx;}  //Compare parent(or right) to left
            if (choiceIdx==startIdx) {break;}   //If the parent survived the comparison, no need to proceed (assume the rest of the branch is heapified)
            
            //Swap
            let temp = heapArr[choiceIdx]; heapArr[choiceIdx] = heapArr[startIdx]; heapArr[startIdx] = temp;
            startIdx = choiceIdx;
        }
    }
    var InvHeapify = function (idx)
    {   //Moves up, from idx to 1 in the heapArr (working in reverse direction compared to Heapify)
        
        var lastIdx = heapArr.length-1; if (idx===void(0)) {idx = lastIdx;}
        var flip    = (isMaxHeap)? 1 : -1;
        
        while (idx>0)
        {
            let parentIdx    = Math.floor((idx-1)/2); //Should give the same result regardless if idx is left or right child
            let heapProperty = (Compare(heapArr[parentIdx],heapArr[idx])*flip>=0)? true : false;
            //Swap parent and idx if the heap property is not preserved
            if (!heapProperty) {let temp = heapArr[parentIdx]; heapArr[parentIdx] = heapArr[idx]; heapArr[idx] = temp;} //Swap
            //Setup for the next iteration
            idx = parentIdx;
        }
    }
    var CheckHeapPropertyAt = function (idx)
    {   //Check the value at idx to see if it still satisfies the heap property
        //The value at idx might have changed and we don't know how (we are only given a compare function to work with)
        
        if (idx===void(0)) {return;}
        
        var flip      = (isMaxHeap)? 1 : -1;
        var data      = heapArr[idx]; //This data might have changed from its orginal value
        var parentIdx = Math.floor((idx-1)/2);
        var leftIdx   = (idx+1)*2 - 1;
        var rightIdx  = (idx+1)*2;
        var lastIdx   = heapArr.length;
        
        //idx is sanwiched between the parent and the children. Check to see if the proportions are correct
        var parentIsCorrectSize = (idx<=0 || Compare(heapArr[parentIdx],heapArr[idx])*flip>0)? true : false;
        var childIsCorrectSize  = (leftIdx>lastIdx || Compare(heapArr[idx],heapArr[leftIdx])*flip>0 && Compare(heapArr[idx],heapArr[rightIdx])*flip>0)? true : false;
        if ( parentIsCorrectSize && !childIsCorrectSize) {Heapify(idx); return;}    //trickling down into the heap
        if (!parentIsCorrectSize &&  childIsCorrectSize) {InvHeapify(idx); return;} //percolating upwards in the heap
    }
    var InsertOne = function (data)
    {   //Inserts one item into the heap and restores the heap property
    
        heapArr.push(data); //item is added at the end of the heap array
        InvHeapify();
    }
    var PrintHeap      = function (splitTheLevels)
    {
        var result = '';
        var count  = heapArr.length;
        for (let i=0; i<count; i++)
        {
            var level = Math.log2(i+2); //An offset of two will give us an integer at the end of a level
            result += heapArr[i];

            if (splitTheLevels && level == Math.floor(level)) {result += '\n';} else {result += ' , ';}
        }
        return result;
    }
    
    //Public methods
    this.IsEmpty       = function ()     {return (heapArr.length==0)? true : false;}
    this.Length        = function ()     {return heapArr.length;}
    this.SetAsMaxQueue = function ()     {if ( isMaxHeap){return;} isMaxHeap = true;  BuildHeap();}
    this.SetAsMinQueue = function ()     {if (!isMaxHeap){return;} isMaxHeap = false; BuildHeap();}
    this.GetTop        = function ()     {return heapArr[0];}
    this.GetItem       = function (idx)  {return heapArr[idx];}
    this.Rebalance     = function (query, asData) {if (!isNaN(query) && !asData) {CheckHeapPropertyAt(query);} else {CheckHeapPropertyAt(heapArr.indexOf(query));}} //query can be an array index
    this.Push          = function (data,asData) 
    {   //Insert data in to the heap
        //Can handle single values(objects) or arrays -> will convert single data into an array regardless
 
        if (data===void(0)){return;}
        if (asData || !IsArray(data)) {data = [data];} else if (data.length==0) {return;} 
        if (heapArr.length==0) {heapArr = data.slice(); BuildHeap(); return;} //Makes a shallow copy of the source array
        
        //If we are here, the heapArr already contains values and new values must be added to it one by one
        var len = data.length;
        for (let i=0; i<len; i++) {InsertOne(data[i]);}
    }
    this.Pop = function () 
    {   //Removes the top item from the heap (restores the heap property) and returns the popped item
        
        var heapSize = heapArr.length; if (heapSize< 1) {return;} //Nothing to do
        var lastItem = heapArr.pop();  if (heapSize==1) {return lastItem;} //Trivial case
        
        var topItem  = heapArr[0]; //Store the top item before erasing it
        heapArr[0]   = lastItem;   //Overwrite the top item with the last item (which was just popped)
        Heapify();                 //Restore the heap property
        return topItem;
    }
    this.Sort = function ()
    {   //Sorts the heap
        //Note: A properly maintained heap is not necessarily a sorted heap
        
        var lastIdx = heapArr.length-1;
        var halfIdx = Math.floor(heapArr.length/2)-1;
        for (let i=lastIdx; i>0; i--) 
        {   //This loop will sort the heapArr in the oposite order (a min heap is sorted with the largest item at the front)
            //The top item is guaranteed min(or max).
            //Put the top item at the bottom -> swap heapArr[1] with heapArr[i]
            let temp = heapArr[0]; heapArr[0]=heapArr[i]; heapArr[i]=temp;
            Heapify(0,i-1);
        }
        //Reverse the sorting
        //Note: a sorted maxHeap will result in an array with the minimum element at the front. The sorted array needs to be reversed to maintain the max heap condition
        for (let i=0; i<=halfIdx; i++) {temp=heapArr[i]; heapArr[i]=heapArr[lastIdx-i]; heapArr[lastIdx-i]=temp;}
    }
    this.toString = function ()
    {
        var result  = '[Object TypeHeap]\n';
            result += 'isMaxHeap   : '+isMaxHeap+'\n';
            result += 'Heap length : '+heapArr.length+'\n';
            result += '---------------------------------------\n'
            result += 'Data        :'
            result += PrintHeap()+'\n';
            result += '---------------------------------------'
        return result;
    }
    
    //Initialization
    Initialize(isMax, compareFunction);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeMazeGenerator (dim)
{   //This object generates a maze out of a grid
    //Grid size is given by the dimentions object
    //The algorithm is based on Prim's concept
    
    //Private properties
    var mazeDim;        //A typeXYZw for the count of cells in the x,y (and z) dimensions of the maze
    var startingCell;   //A TypeXYZw for array coordinates of the beginning of the maze
    var endingCell;     //A TypeXYZw for array coordinates of the ending of the maze
    var mazeArr;        //A grid that holds the maze information. When a cell is non-empty it is registered as part of the maze (it is part of the Prim spanning tree)
    var wallPatternArr; //An array containing the rows-wall-pattern and columns-wall-pattern
    
    //Private methods
    var Initialize = function (dim)
    {
        ChangeDimensions(dim);
    }
    var ChangeDimensions = function (newDim)
    {
        if (newDim===void(0)) {return;}
        newDim = new TypeXYZw(newDim); newDim.SetInt();
        
        if (newDim.x == 0 || newDim.y == 0) {Say('WARNING: (ChangeDimansions) The maze must have non zero X and Y dimensions',-1); return;}
        if (newDim.z == 0) {newDim.z=1;} //Most times the Z is left out but is implied to be 1. (The TypeXYZw initializes z = 0)
        
        mazeDim      = newDim;
        
        AssignStartEnd();
        GenerateGrid();
        GenerateMaze();
        GenerateWallPattern();
        
        return true;
    }
    var AssignStartEnd = function ()
    {
        //The starting cell
        startingCell = new TypeXYZw(0,0,0);
        
        //The ending cell
        var isExitAlongX = (Math.random()>0.5)? true : false;
        var exitXcoord   = ( isExitAlongX)? mazeDim.x : Math.floor(Math.random()*(mazeDim.x-1));
        var exitYcoord   = (!isExitAlongX)? mazeDim.y : Math.floor(Math.random()*(mazeDim.y-1));
        var exitZcoord   = Math.floor(Math.random()*(mazeDim.z-1));
        endingCell   = new TypeXYZw(exitXcoord,exitYcoord,exitZcoord); //The ending cell is outside the mazeArr
    }
    var GenerateGrid = function ()
    {   //Creates an empty array of size 'mazeDim'
 
        mazeArr = [];   //Reset the array
        
        for (let k=0; k<mazeDim.z; k++) 
        {
            mazeArr[k] = []; //this is the array plane (depth)
            for(let j=0; j<mazeDim.y; j++) {mazeArr[k][j] = []; for(let i=0; i<mazeDim.x; i++) {mazeArr[k][j][i]=void(0);} }
        }
    }
    var GenerateMaze = function ()
    {   //Performs a Prim algorithm and fill the mazeArr with direction values
    
        //Note: Each item in the mazeArr is considered a cell
        //Note: When a cell is empty -> void(0) it is considered unvisited
        //Note: When a cell contains a TypeXYZw object (coordinates of parent) it is considered visited (part of Prim)
        //Note: In Prim's algorithm (minimum spanning tree) a node can have many edges, but it can only have ONE PARENT. As such, each cell stores the direction to its parent

        var queueCompare = function (a,b) {return a.weight-b.weight;}  //Priority queue will compare the 'weight' property of the object generated by 'NewQueueItem'
        var minQueue     = new TypePriorityQueue(false,queueCompare);  //This min priority queue will be used to hold proposals (objects containing adjacent 'frontier' cells and random weights)
        
        //The starting cell has no parent direction -> parent coordintas are NaN.
        //The queue holds an object with preperties of -> cellCoords, parentCoords, and a weight value
        minQueue.Push(NewQueueItem(startingCell,new TypeXYZw(NaN,NaN,NaN),0)); 
        
        while (!minQueue.IsEmpty())
        {
            let oneQueueItem;  //Think of a queueItem as a "proposal". An object with properties -> thisCellCoord, parentCellCoord, w
            let currCellData;  //The value in the mazeArr where thisCellCoord is pointing

            //Pop a frontier queueItem
            //Note: A queue item is considerred frontier if its mazeArr cell value is empty (otherwise it is a Prim cell)
            //Note: It is possible that a queueItem pushed earlier has now become Prim, but it is still in the queue
            //Note: Prim cells will be popped then pop again until a non Prim cell is at hand
            do { oneQueueItem = minQueue.Pop(); currCellData = (oneQueueItem)? mazeArr[oneQueueItem.coord.z][oneQueueItem.coord.y][oneQueueItem.coord.x] : NaN;} while (currCellData) 
            
            if (!oneQueueItem) {return;} //if the queue became empty while looking for an item then we are done
            
            //Register the queueItem on the mazeArr as Prim
            mazeArr[oneQueueItem.coord.z][oneQueueItem.coord.y][oneQueueItem.coord.x] = oneQueueItem.parentCoord; //if an array cell is not empty then it is part of the Prim maze
            
            //Push adjacent cells into the queue 
            PushAdjacentCells(oneQueueItem, minQueue); //Push the coordinates of the available adjacent cells
        }

    }
    var GenerateWallPattern = function ()
    {
        //The wall pattern of each row/column is stored as an array of bits (1 or 0) for yes-wall or no-wall 
        /* Example wall pattern is 2D (X,Y)
        LEVEL
        [ [[1,0,0,1,0,1,0,1,0], //array of vertical-walls rows -> ||
           [1,0,1,0,1,0,1,1,1], //Note: there are 9 walls for 8 horCells
           [1,0,0,1,1,0,1,0,1], //Note: one row of this array corresponds to a row of cells in the maze
           [1,0,1,0,0,1,0,0,1],
           [1,1,1,1,0,1,1,1,1],
           [1,0,1,0,1,0,1,0,1]], //Array has 6 horRows -> if (Arr[horRow][column] == 1) {vertical wall exists}
          
          [[1,0,1,0,1,0,1],  //array of horizontal-walls columns -> =
           [1,0,1,1,0,0,1],  //Note: There are 7 walls for 6 vertCells
           [1,0,1,0,0,0,1],  //Note: one row of this array corresponds to a column of cells in the maze
           [1,0,0,0,1,0,1],
           [1,1,0,1,1,0,1],
           [1,0,1,0,0,0,1],
           [1,0,0,1,0,1,1],
           [1,0,0,1,0,0,1]]  //Array has 8 vertRows -> if (Arr[vertRow][column] == 1) {horizontal wall exists}
        ]; //Full level Array
        
        CAPS -> The front/back faces (3D maze)
        [ [1,1,1,1,1,1,1,1], //One row of caps corresponds to one row of cells in the maze
          [1,1,1,1,1,1,1,1], 
          [1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1]
        ] //Array of caps
        
        If the maze is 3D there are multiple Level arrays and cap arrays. Example Array structure
        
        CompleteMazeWallPatternArr = [LevelsArr,CapsArr];
        LevelsArr    = [level1Arr,level2Arr,level3Arr, ...];
        level1Arr    = [vertWallsArr,HorWallsArr]
        vertWallsArr = [row1Arr, row2Arr, ...];
        horWallsArr  = [col1Arr, col2Arr, ...];
        CapsArr      = [level1CapArr,level2CapArr, ...]
        level1CapArr = [row1Arr, row2Arr, ...]
        */

        var capsArr       = [];
        var levelsArr     = [];
        var oneLevelCaps  = []; 
        var nextLevelCaps = []; 
        for (let mazeZ=0; mazeZ<mazeDim.z; mazeZ++)
        {
            let vertWallsArr = [];
            let horWallsArr  = [];
            let oneLevelArr  = [vertWallsArr,horWallsArr];
            
            oneLevelCaps     = nextLevelCaps;
            nextLevelCaps    = [];
            for (let mazeY=0; mazeY<=mazeDim.y; mazeY++)
            {
                if (mazeY<mazeDim.y) 
                {   //When the Y is in range
                    vertWallsArr[mazeY]  = []; //Add a row
                    nextLevelCaps[mazeY] = []; //Add a row
                    if (mazeZ==0) {oneLevelCaps[mazeY] = [];} //Add a row only once
                }
                for (let mazeX=0; mazeX<=mazeDim.x; mazeX++)
                {
                    //Additional +1 walls at the maze boundary---------------------------
                    if (mazeZ< mazeDim.z && mazeY< mazeDim.y && mazeX==mazeDim.x) {vertWallsArr[mazeY][mazeX] = true; continue;} //One more vertical wall at the end
                    if (mazeZ< mazeDim.z && mazeX< mazeDim.x && mazeY==mazeDim.y) {horWallsArr[mazeX][mazeY]  = true; continue;} //One more horizontal wall at the end
                    if (mazeX==mazeDim.x || mazeY==mazeDim.y) {continue;}

                    //Walls within the mazeArr bounds------------------------------------
                    if (mazeY==0) {horWallsArr[mazeX] = [];} //Each cell of the first row of the maze has a row of the horizontal walls
                    if (vertWallsArr[mazeY][mazeX]  === void(0)) {vertWallsArr[mazeY][mazeX]  = true;}
                    if (horWallsArr[mazeX][mazeY]   === void(0)) {horWallsArr[mazeX][mazeY]   = true;}
                    if (oneLevelCaps[mazeY][mazeX]  === void(0)) {oneLevelCaps[mazeY][mazeX]  = true;}
                    if (nextLevelCaps[mazeY][mazeX] === void(0)) {nextLevelCaps[mazeY][mazeX] = true;}
                    
                    //Remove walls depending on mazeArr data
                    let isValidParent;
                    let parentCell = mazeArr[mazeZ][mazeY][mazeX]; //This will determine which cell wall should be removed

                    //Vertical walls across the current row (currentRow is mazeY)
                    isValidParent = (parentCell && !parentCell.IsNaN())? true : false;
                    if (isValidParent && parentCell.x==mazeX-1) {vertWallsArr[mazeY][mazeX]   = false;}
                    if (isValidParent && parentCell.x==mazeX+1) {vertWallsArr[mazeY][mazeX+1] = false;}
                    
                    //Horizontal walls across the current column (currentColumn is mazeX)
                    if (isValidParent && parentCell.y==mazeY-1) {horWallsArr[mazeX][mazeY]    = false;}
                    if (isValidParent && parentCell.y==mazeY+1) {horWallsArr[mazeX][mazeY+1]  = false;}
                    
                    //Cell caps
                    if (isValidParent && parentCell.z==mazeZ-1) {oneLevelCaps[mazeY][mazeX]   = false;}
                    if (isValidParent && parentCell.z==mazeZ+1) {nextLevelCaps[mazeY][mazeX]  = false;}
                }
            }
            
            //Update the two major arrays
            capsArr[mazeZ]   = oneLevelCaps; 
            levelsArr[mazeZ] = oneLevelArr;
            if (mazeZ==mazeDim.z-1) {capsArr[mazeZ+1] = nextLevelCaps;}
        }
        wallPatternArr = [levelsArr, capsArr];
        
        //Remove the exit wall
        if (endingCell.x>mazeDim.x-1) {wallPatternArr[0][endingCell.z][0][endingCell.y][mazeDim.x]=false;} else if (endingCell.x<0) {wallPatternArr[0][endingCell.z][0][endingCell.y][0]=false;}
        if (endingCell.y>mazeDim.y-1) {wallPatternArr[0][endingCell.z][1][endingCell.x][mazeDim.y]=false;} else if (endingCell.y<0) {wallPatternArr[0][endingCell.z][1][endingCell.x][0]=false;}
        if (endingCell.z>mazeDim.z-1) {wallPatternArr[1][mazeDim.z][endingCell.y][mazeDim.x]=false;} else if (endingCell.z<0) {wallPatternArr[1][0][endingCell.y][endingCell.x]=false;}
    }
    var NewQueueItem      = function (thisCell, parentCell, w) {return {coord:thisCell, parentCoord:parentCell, weight:w}; }
    var PushAdjacentCells = function (sourceQueueItem, minQueue)
    {   //Find non visitied (non Prim) adjacent cells and push them into the queue
        //Note: The sourceQueueItem becomes the parent
        
        //Get the coordinates of the six possible adjacent cells
        var currentCoord = sourceQueueItem.coord;
        var xNegCoord    = (currentCoord.x>0)? new TypeXYZw(currentCoord.x-1,currentCoord.y,currentCoord.z) : void(0);
        var xPosCoord    = (currentCoord.x<mazeDim.x-1)? new TypeXYZw(currentCoord.x+1,currentCoord.y,currentCoord.z) : void(0);
        var yNegCoord    = (currentCoord.y>0)? new TypeXYZw(currentCoord.x,currentCoord.y-1,currentCoord.z) : void(0);
        var yPosCoord    = (currentCoord.y<mazeDim.y-1)? new TypeXYZw(currentCoord.x,currentCoord.y+1,currentCoord.z) : void(0);
        var zNegCoord    = (currentCoord.z>0)? new TypeXYZw(currentCoord.x,currentCoord.y,currentCoord.z-1) : void(0);
        var zPosCoord    = (currentCoord.z<mazeDim.z-1)? new TypeXYZw(currentCoord.x,currentCoord.y,currentCoord.z+1) : void(0);
     
        //Push these cells as frontier cells (proposals) in the queue, if they are not already part of the maze (meaning they do not have a parent assigned to them)
        if (xNegCoord && !mazeArr[xNegCoord.z][xNegCoord.y][xNegCoord.x]) {let w=Math.random()*1000000; minQueue.Push(NewQueueItem(xNegCoord,currentCoord,w));}
        if (xPosCoord && !mazeArr[xPosCoord.z][xPosCoord.y][xPosCoord.x]) {let w=Math.random()*1000000; minQueue.Push(NewQueueItem(xPosCoord,currentCoord,w));}
        if (yNegCoord && !mazeArr[yNegCoord.z][yNegCoord.y][yNegCoord.x]) {let w=Math.random()*1000000; minQueue.Push(NewQueueItem(yNegCoord,currentCoord,w));}
        if (yPosCoord && !mazeArr[yPosCoord.z][yPosCoord.y][yPosCoord.x]) {let w=Math.random()*1000000; minQueue.Push(NewQueueItem(yPosCoord,currentCoord,w));}
        if (zNegCoord && !mazeArr[zNegCoord.z][zNegCoord.y][zNegCoord.x]) {let w=Math.random()*1000000; minQueue.Push(NewQueueItem(zNegCoord,currentCoord,w));}
        if (zPosCoord && !mazeArr[zPosCoord.z][zPosCoord.y][zPosCoord.x]) {let w=Math.random()*1000000; minQueue.Push(NewQueueItem(zPosCoord,currentCoord,w));}

    }
    var PrintMazeData = function ()
    {
    
        var result        = '';
        var largestDim    = mazeDim.GetMax();
        var maxDigitCount = (largestDim<1)? 1 : Math.floor(Math.log10(largestDim))+1;
        
        if (maxDigitCount<3) {maxDigitCount=3;} //The beginning cell will contain 'NaN' which is three digits. So pad all other numbers to at least that
        
        for (let k=0; k<mazeDim.z; k++)
        {
            result += 'LEVEL : '+k+'\n'
            for (let j=0; j<mazeDim.y; j++)
            {
                for (let i=0; i<mazeDim.x; i++)
                {
                    let cellContent = mazeArr[k][j][i]; //Cells contain a TypeXYZw (for the coordinates of their parent)
                    result += '<[z:'+PaddedNumber(cellContent.z,maxDigitCount,' ')+', y:'+PaddedNumber(cellContent.y,maxDigitCount,' ')+', x:'+PaddedNumber(cellContent.x,maxDigitCount,' ')+']> ';
                }
                result += '\n';
            }
            result += '\n';
        }
        return result;
    }
    var PrintWallPattern = function ()
    {
        //|¯|¯|¯|¯|¯|
        //|¯|¯|¯|¯|¯|
        // ¯ ¯ ¯ ¯ ¯
        
        var result = '';
        for (mazeZ=0; mazeZ<=mazeDim.z; mazeZ++)
        {
            let levelWalls = '';
            let levelCaps  = '';
            let oneLevelCapsArr = wallPatternArr[1][mazeZ];
            let oneLevelWallArr = wallPatternArr[0][mazeZ];
            for (mazeY=0; mazeY<=mazeDim.y; mazeY++)
            {
                for (mazeX=0; mazeX<=mazeDim.x; mazeX++)
                {
                    //Special cases
                    if (mazeZ< mazeDim.z && mazeY< mazeDim.y && mazeX==mazeDim.x) {levelWalls += (oneLevelWallArr[0][mazeY][mazeX])? '|\n' : ' \n'; continue;} //One more vertical wall at the end
                    if (mazeZ< mazeDim.z && mazeX< mazeDim.x && mazeY==mazeDim.y) {levelWalls += (oneLevelWallArr[1][mazeX][mazeY])? ' '+String.fromCharCode(8254) : '  ';  continue;} //One more horizontal wall at the end
                    if (mazeX< mazeDim.x && mazeY< mazeDim.y && mazeZ==mazeDim.z) {levelCaps  +=  (oneLevelCapsArr[mazeY][mazeX])? ' x' : ' o'; if(mazeX==mazeDim.x-1) {levelCaps += '\n';} continue;} //One more cap layer at the end
                    if (mazeX==mazeDim.x || mazeY==mazeDim.y) {levelWalls += '\n'; continue;}
                    
                    //vertical walls
                    levelWalls += (oneLevelWallArr[0][mazeY][mazeX])? '|' : ' ';
                    
                    //horizontal walls
                    levelWalls += (oneLevelWallArr[1][mazeX][mazeY])? String.fromCharCode(8254) : ' '; //String.fromCharCode(8254) --> overbar
                    
                    //The caps
                    levelCaps  +=  (oneLevelCapsArr[mazeY][mazeX])? ' x' : ' o';
                    if(mazeX==mazeDim.x-1) {levelCaps += '\n';} //New line
                }
            }
            result += 'Level '+mazeZ+'\n';
            result += (mazeZ<mazeDim.z)? levelWalls : '';
            result += levelCaps+'\n';
        }
        return result;
    }
    
    //Public methods
    this.SetDimensions  = function (newDim) {return ChangeDimensions(newDim);}
    this.GetWallPattern = function ()       {return wallPatternArr;}
    this.Regenerate     = function ()       {ChangeDimensions(mazeDim);}
    this.toString = function ()
    {
        var result  = '[Object TypeMazeGenerator]\n';
            result += 'Maze Dimensions [z:'+mazeDim.z+'][y:'+mazeDim.y+'][x:'+mazeDim.x+']\n';
            result += '---------------------------------------------------------------------\n';
            result += PrintMazeData();
            result += '---------------------------------------------------------------------\n';
            result += PrintWallPattern();
        return result;
    }

    //Initialization
    Initialize(dim);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
/*
B-tree when you're managing more than thousands of items and you're paging them from a disk or some slow storage medium.
B-trees can have variable number of children which allow it to hold many records but still maintain a short height tree
Space		O(n)	    O(n)
Search		O(log n)	O(log n)
Insert		O(log n)	O(log n)
Delete		O(log n)	O(log n)

RedBlack tree when you're doing fairly frequent inserts, deletes and retrievals on the tree.
RedBlack Tree has less strict rules around rebalancing which make insertions/deletions quicker than AVL tree
Red-black trees are more general purpose.
Space		O(n)	    O(n)
Search		O(log n)	O(log n)
Insert		O(log n)	O(log n)
Delete		O(log n)	O(log n)

AVL tree when your inserts and deletes are infrequent relative to your retrievals
AVL tree is more strictly balanced so lookups are faster than RB tree
Space		O(n)	    O(n)
Search		O(log n)	O(log n)
Insert		O(log n)	O(log n)
Delete		O(log n)	O(log n)
*/
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeRedBlackTree (compareFunction)
{   //The data structure was implemented from the CLR book (page 308)
    
    //Private properties
    var compFunct;  //if provided this function will be used for tree data comparisons
    var population; //Total number of nodes
    var headNode;   //A TypeNode object
    var nilNode;    //All leaf nodes point to the nilNode (which is colored black)
    
    //Private methods
    var Initialize = function (compareFunction)
    {
        //If no compare function is supplied then regular comparisons will be attmepted
        compFunct  = compareFunction;
        population = 0;
        nilNode    = new TypeNode('NIL'); nilNode.SetAuxVar(NewAuxVariable(0,'black'));
        headNode   = nilNode;
    }
    var NewAuxVariable = function (count,newColor) {return {counter:count,color:newColor}; }
    var DeleteOne = function (thisNode) 
    {   //Deletes the given node (assume thisNode is returned by a find method)
        if (!thisNode) {return false;}
        if (thisNode.GetAuxVar().counter>1) {thisNode.GetAuxVar().counter--; population--; return true;}

        var doFix = (thisNode.GetAuxVar().color=='black')? true : false;       
        var successorNode = nilNode; 
        successorNode.SetEdge(2, thisNode.GetEdge(2)); //Temporarily set the nilNode's parent to thisNode parent

        if (thisNode.GetEdge(0)==nilNode || thisNode.GetEdge(1)==nilNode)
        {   //Case 1: (trivial) thisNode has no left or right child (or neither)
            if (thisNode.GetEdge(0)==nilNode) {successorNode = thisNode.GetEdge(1); successorNode.SetEdge(2, thisNode.GetEdge(2));}
            if (thisNode.GetEdge(1)==nilNode) {successorNode = thisNode.GetEdge(0); successorNode.SetEdge(2, thisNode.GetEdge(2));}
            
            if      (thisNode.GetEdge(2)==nilNode)             {headNode = successorNode;}                      //Just deleted the head itself (no children)
            else if (thisNode.GetEdge(2).GetEdge(0)==thisNode) {thisNode.GetEdge(2).SetEdge(0, successorNode);} //The deleted was a left leaf
            else                                               {thisNode.GetEdge(2).SetEdge(1, successorNode);} //The deleted was a right leaf
        }
        else
        {   //Case2: Non trivial. The successor will be the minimum node on thisNode right subtree
            successorNode = TreeMin (thisNode.GetEdge(1));
            doFix = (successorNode.GetAuxVar().color=='black')? true : false;
            
            if (successorNode==thisNode.GetEdge(1))
            {   //the successor happens to be the immediate right node
                BypassNode (thisNode,successorNode);
                successorNode.GetAuxVar().color = thisNode.GetAuxVar().color;
                successorNode.GetEdge(1).SetEdge(2, successorNode);
                successorNode = successorNode.GetEdge(1); //the right child of the successor is the one to actually be passed for fix
            }
            else
            {
                let x = successorNode.GetEdge(1);
                successorNode.GetEdge(2).SetEdge(0, successorNode.GetEdge(1));
                successorNode.GetEdge(1).SetEdge(2, successorNode.GetEdge(2));
                successorNode.SetEdge(1, thisNode.GetEdge(1));
                thisNode.GetEdge(1).SetEdge(2, successorNode);
                BypassNode (thisNode,successorNode);
                successorNode.GetAuxVar().color = thisNode.GetAuxVar().color;
                successorNode   = x;
            }
        }
        
        if (doFix) {DeletionRepair(successorNode);}
        population--;
        return true;
    }
    var DeletionRepair = function (successorNode)
    {   //Rebalances the tree when a node is freshly deleted
        //Note: This is a helper method for --> DeleteOne
        //Note: Pseudocode page 326 and Fig13.7 of CLR book

        while (successorNode!=headNode && successorNode.GetAuxVar().color=='black') //void(0) is by definition black
        {
            if (successorNode==successorNode.GetEdge(2).GetEdge(0))
            {   //SuccessorNode is a left child
                let brotherNode = successorNode.GetEdge(2).GetEdge(1);
                if (brotherNode.GetAuxVar().color=='red')
                {
                    brotherNode.GetAuxVar().color='black';
                    successorNode.GetEdge(2).GetAuxVar().color = 'red';
                    RotateLeft(successorNode.GetEdge(2));
                    brotherNode = successorNode.GetEdge(2).GetEdge(1);
                }
                if (brotherNode.GetEdge(1).GetAuxVar().color=='black' && brotherNode.GetEdge(0).GetAuxVar().color=='black')
                {
                    brotherNode.GetAuxVar().color='red';
                    successorNode = successorNode.GetEdge(2);
                }
                else if (brotherNode.GetEdge(1).GetAuxVar().color=='black')
                {
                    brotherNode.GetEdge(0).GetAuxVar().color = 'black';
                    brotherNode.GetAuxVar().color='red';
                    RotateRight(brotherNode);
                    brotherNode=successorNode.GetEdge(2).GetEdge(1);
                    
                    brotherNode.GetAuxVar().color = successorNode.GetEdge(2).GetAuxVar().color;
                    successorNode.GetEdge(2).GetAuxVar().color = 'black';
                    brotherNode.GetEdge(1).GetAuxVar().color = 'black';
                    RotateLeft(successorNode.GetEdge(2));
                    successorNode=headNode;
                }
                else
                {
                    brotherNode.GetAuxVar().color = successorNode.GetEdge(2).GetAuxVar().color;
                    successorNode.GetEdge(2).GetAuxVar().color = 'black';
                    brotherNode.GetEdge(1).GetAuxVar().color = 'black';
                    RotateLeft(successorNode.GetEdge(2));
                    successorNode = headNode;
                }
            }
            else
            {   //It is the right child
                let brotherNode = successorNode.GetEdge(2).GetEdge(0);
     
                if (brotherNode.GetAuxVar().color=='red')
                {
                    brotherNode.GetAuxVar().color='black';
                    successorNode.GetEdge(2).GetAuxVar().color = 'red';
                    RotateRight(successorNode.GetEdge(2));
                    brotherNode = successorNode.GetEdge(2).GetEdge(0);
                }
                
                if (brotherNode.GetEdge(1).GetAuxVar().color=='black' && brotherNode.GetEdge(0).GetAuxVar().color=='black')
                {
                    brotherNode.GetAuxVar().color='red';
                    successorNode = successorNode.GetEdge(2);
                }
                else if (brotherNode.GetEdge(0).GetAuxVar().color=='black')
                {
                    brotherNode.GetEdge(1).GetAuxVar().color = 'black';
                    brotherNode.GetAuxVar().color='red';
                    RotateLeft(brotherNode);
                    brotherNode=successorNode.GetEdge(2).GetEdge(0);
                    
                    brotherNode.GetAuxVar().color = successorNode.GetEdge(2).GetAuxVar().color;
                    successorNode.GetEdge(2).GetAuxVar().color = 'black';
                    brotherNode.GetEdge(0).GetAuxVar().color = 'black';
                    RotateRight(successorNode.GetEdge(2));
                    successorNode=headNode;
                }
                else
                {
                    brotherNode.GetAuxVar().color = successorNode.GetEdge(2).GetAuxVar().color;
                    successorNode.GetEdge(2).GetAuxVar().color = 'black';
                    brotherNode.GetEdge(0).GetAuxVar().color = 'black';
                    RotateRight(successorNode.GetEdge(2));
                    successorNode = headNode;
                }
            }
        }
        successorNode.GetAuxVar().color = 'black';
    }
    var AddOne = function (data)
    {   //Add one node into the tree
        //Note: In this red black tree version, multiple instances of the same data simply increment a node counter

        var newNode = new TypeNode(data); 

        newNode.SetEdge(0, nilNode); //Left child
        newNode.SetEdge(1, nilNode); //Right child
        newNode.SetEdge(2, nilNode); //Parent
        newNode.SetAuxVar(NewAuxVariable(1,'red'));
        population++;
        
        //Trivial case: the tree is empty
        if (headNode==nilNode) {headNode = newNode; headNode.GetAuxVar().color = 'black'; return true;}
        
        //Insert into the tree somewhere
        var currentNode = headNode;
        while (currentNode!=nilNode)
        {   //Start from the top and traverse the tree until the correct spot is found
            let comparison = Compare(data,currentNode.GetData());
            if (comparison == 0) {currentNode.GetAuxVar().counter++; return true;} //Identical data simply increments counter
            if (comparison  < 0 && currentNode.GetEdge(0)!=nilNode) {currentNode = currentNode.GetEdge(0); continue;} //Walk left and continue searching
            if (comparison  < 0 && currentNode.GetEdge(0)==nilNode) {currentNode.SetEdge(0, newNode); newNode.SetEdge(2, currentNode); break;} //Add node here and stop searching
            if (comparison  > 0 && currentNode.GetEdge(1)!=nilNode) {currentNode = currentNode.GetEdge(1); continue;} //Walk right and continue searching
            if (comparison  > 0 && currentNode.GetEdge(1)==nilNode) {currentNode.SetEdge(1, newNode); newNode.SetEdge(2, currentNode); break;} //Add node here and stop searching
            
            break; //if structure should never reach down here
        }
        AdditionRepair(newNode);
        return true;
    }
    var AdditionRepair = function (currentNode)
    {   //Rebalances the tree when a node is freshly added
        //Note: This is a helper method for --> AddOne
        //Note: Pseudocode page 316 and Fig13.4 of CLR book
      
        //Trivial checks
        if (currentNode.GetEdge(2)==nilNode) {currentNode.GetAuxVar().color='black'; return;} //Trivial case: The added node was at the top
        if (currentNode.GetEdge(2).GetAuxVar().color=='black' || currentNode.GetEdge(2).GetEdge(2)==nilNode) {return;} //Nothing to do if the parent is already black or if the parent is the head node
        
        //At this point we are guaranteed to have an uncle node
        while (currentNode.GetEdge(2).GetAuxVar().color=='red')
        {   //As long as the parent is a 'red' node
    
            if (currentNode.GetEdge(2).GetEdge(2).GetEdge(0) == currentNode.GetEdge(2))
            {   //Looking down from the grandparent node, the parent is a left child
                
                let uncleNode = currentNode.GetEdge(2).GetEdge(2).GetEdge(1);   //Parent't right sibling node is the uncle
                if (uncleNode.GetAuxVar().color=='red')
                {   //CASE 1: Uncle node is red
                    currentNode.GetEdge(2).GetAuxVar().color = 'black';          //Set the parent's color to black
                    uncleNode.GetAuxVar().color = 'black';                       //Set the uncle's color to black
                    currentNode.GetEdge(2).GetEdge(2).GetAuxVar().color = 'red'; //Set grandparent color to red
                    currentNode = currentNode.GetEdge(2).GetEdge(2);             //Set current node to grandparent
                }
                else if (currentNode == currentNode.GetEdge(2).GetEdge(1))
                {   //CASE 2 --> currentNode is a right child
                    currentNode = currentNode.GetEdge(2); //Set current node to parent
                    RotateLeft(currentNode);                                     //Rotate current node
                    currentNode.GetEdge(2).GetAuxVar().color = 'black';          //Set the parent's color to black
                    currentNode.GetEdge(2).GetEdge(2).GetAuxVar().color = 'red'; //Set grandparent color to red
                    RotateRight(currentNode.GetEdge(2).GetEdge(2));              //Rotate grandparent node
                }
                else
                {
                    currentNode.GetEdge(2).GetAuxVar().color = 'black';          //Set the parent's color to black
                    currentNode.GetEdge(2).GetEdge(2).GetAuxVar().color = 'red'; //Set grandparent color to red
                    RotateRight(currentNode.GetEdge(2).GetEdge(2));              //Rotate grandparent node
                }
            }
            else
            {   //Looking down from the grandparent node, the parent is a right child
                let uncleNode = currentNode.GetEdge(2).GetEdge(2).GetEdge(0);    //Parent't right sibling node is the uncle
                if(uncleNode.GetAuxVar().color=='red')
                {   //CASE 1 --> uncleNode is red
                    currentNode.GetEdge(2).GetAuxVar().color = 'black';          //Set the parent's color to black
                    uncleNode.GetAuxVar().color = 'black';                       //Set the uncle's color to black
                    currentNode.GetEdge(2).GetEdge(2).GetAuxVar().color = 'red'; //Set grandparent color to red
                    currentNode = currentNode.GetEdge(2).GetEdge(2);             //Set current node to grandparent
                }
                else if (currentNode == currentNode.GetEdge(2).GetEdge(0))
                {   //CASE 2 --> currentNode is a left child
                    currentNode = currentNode.GetEdge(2); //Set current node to parent
                    RotateRight(currentNode);                                    //Rotate current node
                    currentNode.GetEdge(2).GetAuxVar().color = 'black';          //Set the parent's color to black
                    currentNode.GetEdge(2).GetEdge(2).GetAuxVar().color = 'red'; //Set grandparent color to red
                    RotateLeft(currentNode.GetEdge(2).GetEdge(2));               //Rotate grandparent node
                }
                else
                {
                    currentNode.GetEdge(2).GetAuxVar().color = 'black';          //Set the parent's color to black
                    currentNode.GetEdge(2).GetEdge(2).GetAuxVar().color = 'red'; //Set grandparent color to red
                    RotateLeft(currentNode.GetEdge(2).GetEdge(2));               //Rotate grandparent node
                }
            }
        }
        headNode.GetAuxVar().color = 'black'; //in case the head changed color on us in the process
    }
    var RotateLeft = function (xNode)
    {   //Does a left rotation
        //Note: the x, y terminology corresponds to fig.13.3, page 314 of the CLR book
        
        //Trivial case
        if (xNode==nilNode || xNode.GetEdge(1)==nilNode) {return false;} //there needs to be a right child for the rotation to complete
        
        let yNode = xNode.GetEdge(1);
        yNode.SetEdge(2, xNode.GetEdge(2)); //switch the parents from x to y
        
        //update the parent to this new change of children
        if      (xNode.GetEdge(2)!=nilNode && xNode.GetEdge(2).GetEdge(1)==xNode) {xNode.GetEdge(2).SetEdge(1, yNode); } //xNode is a right child
        else if (xNode.GetEdge(2)!=nilNode && xNode.GetEdge(2).GetEdge(0)==xNode) {xNode.GetEdge(2).SetEdge(0, yNode); } //xNode is a left child
        else if (xNode.GetEdge(2)==nilNode) {headNode = yNode;}
        
        xNode.SetEdge(2, yNode);            //Set xNode parent to yNode
        xNode.SetEdge(1, yNode.GetEdge(0)); //Set xNode right to yNode left
        yNode.SetEdge(0, xNode);            //Set yNode left to xNode
        if (xNode.GetEdge(1)!=nilNode) {xNode.GetEdge(1).SetEdge(2, xNode);} //Set xNode's right parent to xNode
    }
    var RotateRight = function (xNode)
    {
        //Does a right rotation
        //Note: the x, y terminology corresponds to fig.13.3, page 314 of the CLR book
        
        //Trivial case
        if (xNode==nilNode || xNode.GetEdge(0)==nilNode) {return false;} //there needs to be a left child for the rotation to complete
        
        let yNode = xNode.GetEdge(0);
        yNode.SetEdge(2, xNode.GetEdge(2)); //switch the parents from x to y
        
        //update the parent to this new change of children
        if      (xNode.GetEdge(2)!=nilNode && xNode.GetEdge(2).GetEdge(1)==xNode) {xNode.GetEdge(2).SetEdge(1, yNode); } //xNode is a right child
        else if (xNode.GetEdge(2)!=nilNode && xNode.GetEdge(2).GetEdge(0)==xNode) {xNode.GetEdge(2).SetEdge(0, yNode); } //xNode is a left child
        else if (xNode.GetEdge(2)==nilNode) {headNode = yNode;}
        
        xNode.SetEdge(2, yNode);            //Set xNode parent to yNode
        xNode.SetEdge(0, yNode.GetEdge(1)); //Set xNode left to yNode left
        yNode.SetEdge(1, xNode);            //Set yNode right to xNode
        if (xNode.GetEdge(0)!=nilNode) {xNode.GetEdge(0).SetEdge(2, xNode);} //Set xNode's left parent to xNode
    }
    var BypassNode = function (thisNode, successorNode)
    {   //Bypass thisNode replacing it with successorNode.
        //This is a helper function for --> DeleteOne
        //Note: assumes successorNode.left==None and successorNode==thisNode.right
        
        //Transfer the left branch of thisNode to the successorNode
        successorNode.SetEdge(0, thisNode.GetEdge(0)); //Set successorNode left to thisNode left
        thisNode.GetEdge(0).SetEdge(2, successorNode); //Set thisNode>left>parent to successorNode
        successorNode.SetEdge(2, thisNode.GetEdge(2)); //Set successorNode>parent to thisNode>parent
        
        //Notify the parent node link to the successor node as its newly replaced child
        if (thisNode==headNode) {headNode = successorNode; return;}
        if (thisNode.GetEdge(2).GetEdge(1)==thisNode) {thisNode.GetEdge(2).SetEdge(1, successorNode);}
        else {thisNode.GetEdge(2).SetEdge(0, successorNode);}
    }
    var TreeMin = function (startingNode) 
    {   //The minimum leaf from this branch
        //Returns the node object
        
        if (!startingNode && headNode==nilNode) {return;}
        if (!startingNode && headNode!=nilNode) {startingNode = headNode;}
        
        var currentNode = startingNode;
        while (currentNode.GetEdge(0)!=nilNode) {currentNode = currentNode.GetEdge(0);}
        return currentNode;
    }
    var Lookup  = function (data, startingNode) 
    {   //Lookup 'data' into the tree
        //Returns the node that contains 'data'
        
        var currentNode;
        if (!startingNode) {currentNode = headNode;} else {currentNode = startingNode;}
        
        while (currentNode!=nilNode && currentNode.GetData()!=data)
        {   //Navigate the tree to the correct spot
            let comparison = Compare(data,currentNode.GetData());
            if (comparison< 0) {currentNode = currentNode.GetEdge(0); continue;}
            if (comparison>=0) {currentNode = currentNode.GetEdge(1);}
        }
        return currentNode;
    }
    var PrintTree = function ()
    {
        //Using two arrays. One holds the nodes of the current row and in the other we add all the children
        var result     = '';
        var levelCount = 1;
        var currLevel  = []; if (headNode!=nilNode) {currLevel.push(headNode);}
        
        while (currLevel.length>0)
        {
            let nextLevel    = []; //All children nodes will be stored here
            let nextActCount = 0;  //Counts non NIL children nodes
            let currTreeRow  = '';
            let currCount    = currLevel.length; //The current level
            for (let i=0; i<currCount; i++)
            {   //Walk through the current level and push all children into the nextLevel array
        
                let currentNode   = currLevel[i];
                let currNodeData  = (currentNode!=nilNode)? currentNode.GetData() : 'X';
                let currNodeCount = (currentNode!=nilNode)? currentNode.GetAuxVar().counter : 0;
                let leftChild     = (currentNode.GetEdge(0))? currentNode.GetEdge(0) : nilNode;
                let rightChild    = (currentNode.GetEdge(1))? currentNode.GetEdge(1) : nilNode;
                let lData = leftChild.GetData();
                let rData = rightChild.GetData();
                nextLevel.push(leftChild,rightChild); if (currentNode!=nilNode) {nextActCount++;}
                currTreeRow += currNodeData;
                if (currNodeCount>1) {currTreeRow += '('+currNodeCount+')'}
                if (i<currCount-1) {currTreeRow += ' , ';} else {currTreeRow += '\n';}
            }
            currLevel = (nextActCount>0)? nextLevel : [];
            result   += (nextActCount>0)? '<Level '+levelCount+'> '+currTreeRow : ''; levelCount++;
        }
        return result;
    }
    var Compare = function (a, b) {return (compFunct)? compFunct(a,b) : (a==b)? 0 : (a>b)? 1 : -1;}
    
    //Public methods
    this.Delete = function (data)
    {
        if (data===void(0)) {return;} //Nothing to do
    
        var foundNode = Lookup(data); if (foundNode==nilNode) {Say('WARNING: (Delete) Could not delete. Item <'+data+'> was not found in the tree',-1); return;}
        return DeleteOne(foundNode);
    }
    this.Insert = function (data, asData)
    {   //Handles an array of things as well as single data (objects, or numbers)
        //Note: if data is an array, then 'asData' can override the default behavior and store the whole array as a single data object instead of spreading it across the tree
        
        //Argument gate
        if (data===void(0)) {return;} //Nothing to do
        if (!IsArray(data) || asData==true) {return AddOne(data);}
        
        //Handle the data being an array scenario
        var count = data.length;
        for (let i=0; i<count; i++) {if (!AddOne(data[i])){return;}}
        return true;
    }
    this.toString = function ()
    {
        var result  = '[Object TypeRedBlackTree]\n';
            result += 'Population : '+population+'\n';
            result += '--------------------------------------------\n';
            result += 'Data       :\n'+PrintTree();
            result += '--------------------------------------------\n';
        return result;
    }
    
    //Initialization
    Initialize(compareFunction);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
