var markerToRemove
var csrftoken = $.cookie('csrftoken');
//console.log(csrftoken)
var nodeSlug;
var latlngToInsert
var markerMap={}
var colors={"provinciawifi":"blue","rome":"green","pisa":"red","viterbo":"yellow"}

//Marker manual insert on map
function onMapClick(e) {
	//alert(e.latlng);
	if (markerToRemove) {
		map.removeLayer(markerToRemove);
	}
	
	markerLocation = e.latlng
	markerLocationtoString = e.latlng.toString();
	marker = new L.Marker(markerLocation);
	markerToRemove=marker
	var popupelem= document.createElement('div');
	popupelem.innerHTML+='Is position correct ?<br>';
	popupelem.innerHTML+='<a class=\'confirm_marker\' onclick=markerConfirm(markerLocation)>Confirm</a>&nbsp;';
	popupelem.innerHTML+='<a class=\'remove_marker\' onclick=markerDelete(marker)>Delete</a>';
	
	map
		
		.addLayer(marker);
	popup
		.setLatLng(e.latlng)
		.setContent(popupelem)
		.openOn(map);
	
}

//Marker delete
function markerDelete(marker) {
	map.removeLayer(marker);
	map.closePopup();	
}

//Marker confirm
function markerConfirm(marker) {
	openInsertDiv(marker);
	map.closePopup();
}

//Layers load
function loadLayers(layers) {
	var allLayers= []
	for (i in layers)
		{
		var color=colors[layers[i].slug];
		clusterClass=layers[i].slug;
		//alert(layers[i].name );
		var newCluster = createCluster(clusterClass)
		var newClusterNodes=   getData(window.__BASEURL__+'api/v1/layers/'+layers[i].slug+'/geojson/');
		var newClusterLayer=loadNodes(newClusterNodes,color)	;
		newCluster.addLayer(newClusterLayer);
		map.addLayer(newCluster);
		var newClusterKey=layers[i].name;
		overlaymaps[newClusterKey]=newCluster;
		allLayers[i]=newCluster;
		}
	return allLayers;

}

//create cluster group
function  createCluster(clusterClass) {
var newCluster=
new L.MarkerClusterGroup(
		{
		iconCreateFunction: function (cluster) {
				return L.divIcon({
					html: cluster.getChildCount(),
					className: clusterClass,
					iconSize: L.point(30, 30) });
					},
		spiderfyOnMaxZoom: true, showCoverageOnHover: true, zoomToBoundsOnClick: true
			}
			);
return newCluster;	
}

//Load layer nodes
function loadNodes(newClusterNodes,color){

	var layer=
	L.geoJson(newClusterNodes, {
		
	onEachFeature: function (feature, layer) {
		var nodeSlug=feature.properties.slug;
		//nodeAddress=feature.properties.address;
		layer.on('click', function (e) {
			populateNodeDiv(feature.properties.slug,1);
			this.bindPopup(nodeDiv);
			populateRating(nodeSlug,nodeDiv,nodeRatingAVG)
				});
		
		},
	pointToLayer: function (feature, latlng) {
				var marker= new
					L.circleMarker(latlng, {
					radius: 8,
					fillColor: color,
					color: color,
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8
				});
				markerMap[feature.properties.slug] = marker;
				return marker;
			}
		
	});
	
	return layer;	
}

//Delete all layers from map
function clearLayers()  {
            for (x in mapLayers) {
		//alert (x);
		mapLayers[x].clearLayers();
	    }
        }

	
//show layer properties	
function showLayerProperties()  {
for (var x in mapLayers) {
		//alert (x);
		var layergroups=[]
	//layergroups=	mapLayers[x].getLayers();
	//console.log(layergroups)
	mapLayers[x].eachLayer(function (layer) {
    alert(layer.id)
});
	}
}


//Info on node to be displayed on popup
function populateNodeDiv(nodeSlug,create) {
	var create_me=create
	if (create_me ==1) {
		nodeDiv = document.createElement('div');
		nodeDiv.id=nodeSlug;	
	}
	
	node=   getData(window.__BASEURL__+'api/v1/nodes/'+nodeSlug+'/participation/');
	nodeName=node.name;
	nodeAddress=node.address;
	nodeRatingCount=node.participation.rating_count;
	nodeRatingAVG=node.participation.rating_avg;
	nodeLikes=node.participation.likes;
	nodeDislikes=node.participation.dislikes;
	nodeVoteCount=nodeLikes+nodeDislikes;
	nodeComments=node.participation.comment_count;
	
	$(nodeDiv).append('<strong>'+nodeName+'</strong><br>');
	$(nodeDiv).append(nodeAddress+'<br>');
	$(nodeDiv).append('<strong>Rating:</strong><br>');
	$(nodeDiv).append('<div id="star"></div>');
	
	$(nodeDiv).append('<strong>Votes:</strong><br>');
	$(nodeDiv).append('In favour: <strong>'+nodeLikes+'</strong><br>');
	$(nodeDiv).append('Against: <strong>'+nodeDislikes+'</strong><br>');
	
	var like=1
	var dislike=-1
	$(nodeDiv).append('<button class="vote" onclick=postVote(\''+nodeSlug+'\',\''+like+'\')>In favour</button>');
	$(nodeDiv).append('<button class="vote" onclick=postVote(\''+nodeSlug+'\',\''+dislike+'\')>Against</button><br>');
	
	$(nodeDiv).append('<strong>Comments:</strong><br>');
	$(nodeDiv).append('<a onclick=showComments("'+nodeSlug+'");>comments: '+ nodeComments +'</a><br>');

	populateRating(nodeSlug,nodeRatingAVG)
	return(nodeDiv,nodeRatingAVG)

}

//Create a list with layers' slug and name
function getLayerListSlug(layers,cssLayer) {
	layerList=[];
	for(var i=0;i<layers.length;i++){
		layerList[i]={}
		var obj = layers[i];
		for(var key in obj){
			var attrName = key;
			var attrValue = obj[key];
			if (key=='slug' || key== 'name' ) {
				layerList[i][key]=attrValue;
			}	    
		}
	}
	var options = $("#"+cssLayer);	
	$.each(layerList, function(obj,city) {
		options.append($("<option />").val(city.slug).text(city.name));
		});
}

//Create a list with layers' id and name
function getLayerListId(layers,cssLayer) {
	layerList=[];
	for(var i=0;i<layers.length;i++){
		layerList[i]={}
		var obj = layers[i];
		for(var key in obj){
			var attrName = key;
			var attrValue = obj[key];
			if (key=='id' || key== 'name' ) {
				layerList[i][key]=attrValue;
			}	    
		}
	}
	var options = $("#"+cssLayer);	
	$.each(layerList, function(obj,city) {
		options.append($("<option />").val(city.id).text(city.name));
		});
}

//function to catch and display PoI coordinates
function openInsertDiv(latlng){

	latlngToString = latlng.toString();
	var arrayLatLng=latlngToString.split(",");
	lat=arrayLatLng[0].slice(7);
	lng=arrayLatLng[1].slice(0,-1);
	latlngToInsert=lat+','+lng;
	//alert (latlng)
	var address=   getData('http://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+lng+'&zoom=18&addressdetails=1');
	//console.log(address);
	
	$("#valori").html('');
	htmlText='<strong>Insert node details</strong><br>';
	htmlText+='<div class="label" >Layer</div>';
	htmlText+='<select id= "selectLayerNodeInsert"class="layerSelect" >';
	htmlText+='</select>';
	htmlText+='<div class="label" >Name</div>';
	htmlText+='<input class="input" id="nodeToInsertName">';
	htmlText+='<div class="label" >Address</div>';
	htmlText+='<textarea class="valore" id="nodeToInsertAddress"></textarea>';
    	htmlText+='<div class="label" >Lat</div>';    
	htmlText+='<div class="valore" id="nodeToInsertLat"></div>';
	htmlText+='<div class="label" >Lng</div>';
	htmlText+='<div class="valore" id="nodeToInsertLng"></div>';
	htmlText+='<button onclick=insertNode(nodeSlug,lat,lng);>Insert node</button>';
	var nodeInsertDiv = $("<div>", {id: "nodeInsertDiv"});
	
	$(nodeInsertDiv).append(htmlText);
	$("#valori").append(nodeInsertDiv);
	$("#nodeToInsertLng").html(lng);
	$("#nodeToInsertLat").html(lat);
	$("#nodeToInsertAddress").val(address.display_name);
	getLayerListId(layers,"selectLayerNodeInsert");
	
        }
	
function insertNode(nodeSlug,lat,lng){
	//alert('latlng: '+ lngLatInsert )
	var nodeToInsert={}
	nodeToInsert["layer"]=$("#selectLayerNodeInsert").val();
	nodeToInsert["name"]=$("#nodeToInsertName").val();
	nodeToInsert["slug"]=convertToSlug($("#nodeToInsertName").val())
	nodeToInsert["address"]=$("#nodeToInsertAddress").val();
	nodeToInsert["coords"]=lat+','+lng;
	console.log (nodeToInsert);
	postNode(nodeSlug,nodeToInsert,lat,lng);
}

//post a node
function postNode(nodeSlug,node_json,lat,lng) {
	nodeSlug=node_json["slug"];
	console.log (nodeSlug);
	var latlng=new L.LatLng(lat, lng);
    var ok=confirm("Add node?");
	if (ok==true)
		{
		$.ajax({
		type: "POST",
		url: 'http://localhost:8000/api/v1/nodes/',
		data: node_json,
		dataType: 'json',
		success: function(response){
		clearLayers();
		map.removeControl(mapControl)
		mapLayers=loadLayers(layers);
		mapControl=L.control.layers(baseMaps,overlaymaps).addTo(map);
		var newMarker=L.marker(latlng).addTo(map);
		populateNodeDiv(nodeSlug,1);
		//newMarker.bindPopup("Node added");
		newMarker.bindPopup(nodeDiv).openPopup();
		populateRating(nodeSlug,nodeDiv,nodeRatingAVG);
		$("#nodeInsertDiv").html('Node inserted')
		    }
		
	      });
	  }
}

//Show_comments
function showComments(nodeSlug) {

	$("#valori").html('');
	var commentsDiv = $("<div>", {id: "comments"});
	var node=nodeSlug
	url=window.__BASEURL__+'api/v1/nodes/'+node+'/comments/?format=json';
	comments=   getData(url);
	//console.log(comments);
	htmlText='Comments on node: <strong>'+node+'</strong><br>';
	htmlText+='<div id="comment" >';
	for (var i = 0; i < comments.length; i++) { 
		var comment=comments[i].text;
		var username=comments[i].username;
		var added=comments[i].added;
		htmlText+='<div  class="comment_div">';
		htmlText+='<span class="comment_user">'+username+'</span>';	
		htmlText+='<div class="comment_text">';
		htmlText+=escapeHtml(comment);
		htmlText+='</div>';
		htmlText+='<span class="comment_date">'+added+'</span>';	
		htmlText+='</div>';
		}
	
	htmlText+='</div><div id="pagingControls"></div>'
	
	$(commentsDiv).html(htmlText);
	pager = new Imtech.Pager();
	
	htmlText='<hr>Add your:<br>';
	htmlText+='<textarea id="commentText"></textarea><br>';
	htmlText+='<button onclick=postComment("'+node+'");>Add comment</button>';
	$(commentsDiv).append(htmlText);
	$("#valori").append(commentsDiv);
	$(document).ready(function() {
	pager.paragraphsPerPage = 5; // set amount elements per page
	pager.pagingContainer = $('#comment'); // set of main container
	pager.paragraphs = $('div.comment_div', pager.pagingContainer); // set of required containers
	pager.showPage(1);
	});
	
}


	

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }



function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}


function sameOrigin(url) {
    // test that a given url is a same-origin URL
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
        (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
        // or any other URL that isn't scheme relative or absolute i.e relative.
        !(/^(\/\/|http:|https:).*/.test(url));
}


//Ajax check
    
 $(function() {
	
    $.ajaxSetup({
	beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
            // Send the token to same-origin, relative URLs only.
            // Send the token only if the method warrants CSRF protection
            // Using the CSRFToken value acquired earlier
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    },
        error: function(jqXHR, exception) {
            if (jqXHR.status === 0) {
                alert('Not connect.\n Verify Network.');
            } else if (jqXHR.status == 404) {
                alert('Requested page not found. [404]');
            } else if (jqXHR.status == 500) {
                alert('Internal Server Error [500].');
            } else if (exception === 'parsererror') {
                alert('Requested JSON parse failed.');
            } else if (exception === 'timeout') {
                alert('Time out error.');
            } else if (exception === 'abort') {
                alert('Ajax request aborted.');
            } else {
                alert('Uncaught Error.\n' + jqXHR.responseText);
            }
        }
    });
});
  
 //Get Data in async way, so that it can return an object to a variable
function getData(url) {
var data;
    $.ajax({
        async: false, //thats the trick
        url: url,
        dataType: 'json',
        success: function(response){
        data = response;
        }
        
    });
    //alert(data);
    return data;
}

function createNodelist() {
    layer=$("#selectLayerNodeList").val();
    if (layer != " ") {
	
    $.ajax({
        type: 'GET',
        url: window.__BASEURL__+'api/v1/layers/'+layer+'/nodes',
        dataType: 'json',
        //data: JSON.stringify(bounds),
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            addToList(result)
        },
    })
    }
}

function addToList(data) {
	//console.log(JSON.stringify(data))
	$("#valori").html('');
	$("#nodelist").html('');
    for (var i = 0; i < data.nodes["results"].length; i++) {
	//console.log(data.nodes["results"][i])
        var nodes = data.nodes["results"][i];
        $("#nodelist").append('<a href="#" class="list-link" data-slug='+nodes["slug"]+' >' + nodes.name + '</a><br>')
    }
    $('a.list-link').click(function (e) {
        //Get the id of the element clicked
        var slug = $(this).data( 'slug' );
        var marker = markerMap[slug];
	//console.log(marker.toGeoJSON());
        //marker.openPopup(marker.getLatLng());
	populateNodeDiv(slug,1);
        marker.addTo(map)
	marker.bindPopup(nodeDiv)
	populateRating(slug,nodeDiv,nodeRatingAVG)
	marker.openPopup()
    })
}
//post a comment
function postComment(nodeSlug) {
	comment=$("#commentText").val();
	var ok=confirm("Add comment for this node?");
	if (ok==true)
	{
	$.ajax({
		type: "POST",
		url: window.__BASEURL__+'api/v1/nodes/'+nodeSlug+'/comments/',
		data: { "text": comment},
		dataType: 'json',
		success: function(response){	
			var nodeDiv=  $("#" + nodeSlug);
			$(nodeDiv).html('');
			populateNodeDiv (nodeSlug,0);
			populateRating(nodeSlug,nodeDiv,nodeRatingAVG);
			showComments(nodeSlug);
			alert("Your comment has been added!");
			 }
        
		 });
	}
}

//post a vote
function postVote(nodeSlug,vote) {
	var ok=confirm("Add vote " + vote + " for this node?");
	if (ok==true)
	{
	$.ajax({
		type: "POST",
		url: 'http://localhost:8000/api/v1/nodes/'+nodeSlug+'/votes/',
		data: { "vote": vote},
		dataType: 'json',
		success: function(response){	
			var nodeDiv=  $("#" + nodeSlug);
			$(nodeDiv).html('')
			populateNodeDiv (nodeSlug,0);
			populateRating(nodeSlug,nodeDiv,nodeRatingAVG);
			alert("Your vote has been added!");
			}
        
		});
	  }
}

//post a rating
function postRating(nodeSlug,rating) {
	var ok=confirm("Add rating " + rating + " for this node?");
	if (ok==true)
	{
		$.ajax({
	    type: "POST",
	    url: 'http://localhost:8000/api/v1/nodes/'+nodeSlug+'/ratings/',
	    data: { "value": rating},
	    dataType: 'json',
	    success: function(response){	
			var nodeDiv=  $("#" + nodeSlug);
			$(nodeDiv).html('')
			populateNodeDiv (nodeSlug,0);
			populateRating(nodeSlug,nodeDiv,nodeRatingAVG)
			alert("Your rating has been added!");
			}	    
	});
	}
}

function populateRating(nodeSlug,nodeDiv,nodeRatingAVG) {
	
	x=$(nodeDiv).find('#star');
	$(x).raty(  {
			score: nodeRatingAVG,
			number:10,
			path: $.myproject.STATIC_URL+'participation/js/vendor/images',
			 click: function(score) {
				postRating(nodeSlug,score );
				}
			
		}
		  );
	 };
	 


//login
function login() {
user=$("#user").val();
var password=$("#password").val();
    $.ajax({
        type: "POST",
        url: window.__BASEURL__+"api/v1/account/login/",
	data: { "username": user, "password": password },
        dataType: 'json',
        success: function(response){
        showLogout(user);
        }
    });
}

//logout
function logout() {
    $.ajax({
        type: "POST",
        url: window.__BASEURL__+"api/v1/account/logout/",
        dataType: 'json',
        success: function(response){
	showLogin();
        }
        
    });
}

function showLogin() {
	$('#userForm').html('');
	var login_html='<input id="user" class="span2" type="text" placeholder="Email">'
	login_html+='<input id="password" class="span2" type="password"placeholder="Password">'
        login_html+=' <button id="loginButton" type="button" onclick=login() class="btn">Sign in</button>'
	$('#userForm').append(login_html)
}

function showLogout(user) {
	$('#userForm').html('');
	var logout_html='<font color="#FFFFFF">Hi ' + user + ' </font>'
	logout_html+='<button id="logoutButton" type="button" onclick=logout() class="btn">Sign out</button>'
	$('#userForm').append(logout_html)
	
}

// Load #loading layers
// Assuming that the div or any other HTML element has the ID = loading and it contains the necessary loading image.

$('#loading').hide(); //initially hide the loading icon
 
        $('#loading').ajaxStart(function(){
            $(this).show();
            //console.log('shown');
        });
        $("#loading").ajaxStop(function(){
            $(this).hide();
            //  console.log('hidden');
        });
	
function convertToSlug(Text)
{
    return Text
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'-')
        ;
}
