//+++++++++++++++++++++++++++
//Author: Thomas Androxman
//Date  : Dec/2017
//+++++++++++++++++++++++++++

//Global Functions-----------------------------------------------------------------------------------------------------------------------------------

//===================================================================================================================================================
//Classes / Constructor-functions
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeNode (newData)
{
    //PRIVATE properties
    var data     = newData; //This can be anything.
    var edgesArr = [];      //Array of references to other nodes
    var auxVar;             //An auxiliary variable for miscellaneous uses (internally)
   
    //PUBLIC Methods
    this.DeleteEdges  = function ()            {edgesArr=[]; return this;}
    this.PushEdge     = function (newEdge)     {if (newNode!==void(0) && !(newNode instanceof TypeNode)) {return;} edgesArr.push(newNode); return this;}
    this.PopEdge      = function ()            {return edgesArr.pop();}
    
    this.GetEdge      = function (idx)         {return edgesArr[idx];}
    this.GetData      = function ()            {return data;}
    this.GetEdgeCount = function ()            {return edgesArr.length;}
    this.GetCopy      = function ()            {return new TypeNode(data);} //Shallow copy of the node  
    
    this.SetEdge      = function (idx,newNode) {if (newNode!==void(0) && !(newNode instanceof TypeNode)) {return;} edgesArr[idx]=newNode;}
    this.SetData      = function (newData)     {data = newData;}
    this.SetEqualTo   = function (otherNode)
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
        
        Populate (sourceList,idx1,idx2,deleteFromSource);
    }
    var CleanRangeVal  = function (idx1,idx2,length)
    {
        if (length==0) {return;} //Trivial case
        if (idx1===void(0) && idx2===void(0)) {idx1=0; idx2=length-1;} //Default to the whole range when both are empty
        if (isNaN(idx1)) {Say('WARNING: (CheckRangeVal) Did not receive a numeric start index',-1); return;} 
        if (isNaN(idx2) || idx2<idx1) {idx2 = idx1;} else if (idx2>=length) {idx2=length-1;} //Clip the ending index.
        if (idx1<0 || idx1>length-1) {return;} //idx1 should not be as tolerant as idx2
        return {index1:idx1,index2:idx2};
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
    this.Push       = function (thisThing, asData) {this.Insert(thisThing,size,asData);} //Synonym for PushBack
    this.PushBack   = function (thisThing, asData) {this.Insert(thisThing,size,asData);}
    this.PushFront  = function (thisThing, asData) {this.Insert(thisThing,0,asData);}
    this.Pop        = function ()                  {return this.Delete(size-1);}         //Synonym for PopBack
    this.PopBack    = function ()                  {return this.Delete(size-1);}
    this.PopFront   = function ()                  {return this.Delete(0);}
    this.IsForward  = function ()                  {return (left==0)? true : false;}
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
function TypeDelaunayTriangulation (sourceBoundary)
{   //Triangulate a planar closed curve
    //Note: In the future this shouls handle 3D meshing and should receive a construction array of how the surface is made
    
    //Note: There are two steps involved. 
    //Note: Step 1 - Delaunay constrained triangulation. (subdivide a starting global triangle by introducing points from a vertex set one by one and performing Delaunay tests on each insertion)
    //Note: Step 2 - Refinement, by adding stainer points on boundary edges (by diametral circle test) and adding circumcenter points on bad triangles
    
    //Private properties
    var sourceCurve;      //A TypeCurve object (closed planar curve)
    var sourceVertices;   //The vertices of the boundary
    var trianglesTree;    //A tree of TypeNode nodes representing the triangulation history. Each node represents a triangle (three points in an array) and has 2 or 3 edges representing triangle subdivisions
    
    //Private methods
    var Initialize = function (sourceBoundary)
    {
        //Argumant gate
        if (!(sourceBoundary instanceof TypeCurve)) {Say('WARNGING: (Initialize) The source boundary must be a TypeCurve object'); return;}
        if (! sourceBoundary.IsPlanar() && !sourceBoundary.IsClosed()) {Say('WARNGING: (Initialize) Did not receive a closed planar curve'); return;}

        sourceCurve = sourceBoundary;
        if (sourceCurve.IsComputedType()) {sourceVertices = sourceCurve.GetComputedVertArr();}
    }
    
    //Initialization
    Initialize(sourceBoundary);
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
function TypeHeap ()
{
    
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeRedBlackTree ()
{
    
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeHashGrid ()
{
    
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
