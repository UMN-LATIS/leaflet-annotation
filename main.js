var layerGroup;
var loadAnnotation = function(sideCar) {

    layerGroup = L.layerGroup().addTo(map); //add elements to layergroup that runs on top of map instead of the map itself. This way, we can clear the layer group in one go




//arrow button (arrow icon)


//snap to location

//coordinate information in bottom left hand side of map

//location button (globe icon)


//annotations

//data about layers
function applyJsonData (obj) {
    layerGroup.clearLayers() //clear current layer group whenever the json string is changed

    //set brightness and contrast
    document.getElementsByClassName("leaflet-pane")[0].style.filter = "brightness(" + obj.brightness / 50 + ")" + "contrast(" + obj.contrast + "%)"
    obj.arrows.forEach(function(arrow) { //load arrows
        arrowOptions.color = arrow.color
        var a = new L.Arrow(arrow, arrowOptions)
        a.addTo(layerGroup)
    })

    //load annotations
    obj.annotations.forEach(function(annotation) {
        var an = new L.marker([annotation.lat, annotation.lng]).bindPopup(annotation.text)
        an.addTo(layerGroup)
        an.openPopup()
    })

    //load shapes
    obj.shapes.forEach(function(shape) {
        if (shape.type == 'polygon' || shape.type == 'rectangle') {
            var polygon = new L.polygon(shape.latlngs, {color: shape.color, fillOpacity: 0}).addTo(layerGroup)
        } else if (shape.type == 'polyline') {
            var polyline = new L.polyline(shape.latlngs, {color: shape.color}).addTo(layerGroup)
        }
    })
}

function appendSceneTag (sceneName) {
    var sceneTag = '<br> \
    <input type="radio" class="select_scene_radio" name="scene_radio" value="' + sceneName + '"> \
    <i class="glyphicon glyphicon-chevron-down" scene="' + sceneName + '"></i> \
    ' + sceneName + ' \
    <div id="' + sceneName + '_info"></div> \
    '
    document.getElementById("scene_tags").insertAdjacentHTML('beforeend', sceneTag)
}

function loadScenes (scenes) {
    //load scenes at the bottom of the page
    document.getElementById("scene_tags").innerHTML = '';
//       document.getElementById("scene_tags").innerHTML = ' \
    // <i class="glyphicon glyphicon-chevron-down" scene="current_scene" state="hide"></i> Current Scene \
    // <div id="current_scene_info"></div> \
    // '
    for (var key in scenes) {
        appendSceneTag(key)
    }
}

function setJsonData (obj) { //set json data whenever the JSON string is changed
    mapJson.brightness = obj.brightness
    mapJson.contrast = obj.contrast
    mapJson.arrows = obj.arrows
    mapJson.annotations = obj.annotations
    mapJson.shapes = obj.shapes
    mapJson.scenes = obj.scenes
    applyJsonData(mapJson)
    loadScenes(mapJson.scenes)
}

function addToJson (type, data) {
    switch (type) {
        case 'arrow':
        mapJson.arrows.push(data)
        break
        case 'brightness':
        mapJson.brightness = data
        break
        case 'contrast':
        mapJson.contrast = data
        break
        case 'annotation':
        mapJson.annotations.push(data)
        break
        case 'shape':
        mapJson.shapes.push(data)
        break
    }
}

function getJson (type) {
    switch (type) {
        case 'brightness':
        return mapJson.brightness
        case 'contrast':
        return mapJson.contrast
    }
}

var jsonModal = L.easyButton( '<i title="Upload/Download" class="glyphicon glyphicon-folder-open"></i>', function() {
    map.fire('modal', {

        content: '<br> \
        <a id="download_button"><button class="btn btn-primary btn-md btn-block fileOptionButton">Download Scenes</button></a> \
        <a id="save_button"><button class="btn btn-info saveToServer btn-md btn-block fileOptionButton">Save Scenes to Server</button></a> \
        <label for="json_file" class="btn btn-secondary btn-md btn-block fileOptionButton"> Upload Scenes \
        <input type="file" id="json_file" style="display:none;"> \
        </label>',
        closeTitle: 'close',                 // alt title of the close button
        zIndex: 10000,                       // needs to stay on top of the things
        transitionDuration: 300,             // expected transition duration

        template: '{content}',               // modal body template, this doesn't include close button and wrappers

        onShow: function(evt){
            //handle download of json
            $("#download_button").click(function() { //handle download of json string
                var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mapJson))

                // Create export
                document.getElementById('download_button').setAttribute('href', 'data:' + convertedData)
                document.getElementById('download_button').setAttribute('download', 'data.json') //data.json is the filetype
            })

            $("#save_button").click(function() {
                var convertedData = JSON.stringify(mapJson);
                $.post(saveURL, {sidecarContent: JSON.stringify(convertedData)})
                    .done((msg) => {
                        map.closeModal();

                    })
                    .fail((xhr, status, error) => {
                        alert('Error: failed to save changes');
                    });
            });

            //handle upload of json string
            $("#json_file").change(function() {
                var files = document.getElementById('json_file').files

                if (files.length <= 0) {
                    return false
                }

                var fr = new FileReader()

                //load json from file
                fr.onload = function(e) {
                    var result = JSON.parse(e.target.result)
                    setJsonData(result)
                }

                fr.readAsText(files.item(0))
            })
        },
        // change at your own risk
        OVERLAY_CLS: 'overlay',              // overlay(backdrop) CSS class
        MODAL_CLS: 'modal',                  // all modal blocks wrapper CSS class
        MODAL_CONTENT_CLS: 'modal-content',  // modal window CSS class
        INNER_CONTENT_CLS: 'modal-inner',    // inner content wrapper
        SHOW_CLS: 'show',                    // `modal open` CSS class, here go your transitions
        CLOSE_CLS: 'close'                   // `x` button CSS class
    })
})

//bring all easy button components into editing toolbar
var toolbar = L.easyBar([colorToggle, arrowButton, locationModal, brightnessContrastModal, annotationButton, jsonModal])
toolbar.addTo(map) //not layer group, we want this to stay on the map

//Draw

//edit the drawing toolbar
var drawToolbar = document.getElementsByClassName("leaflet-draw-toolbar leaflet-bar leaflet-draw-toolbar-top")[0]
drawToolbar.removeChild(drawToolbar.childNodes[drawToolbar.childNodes.length - 2]) //removes circle from drawing toolbar
drawToolbar.removeChild(drawToolbar.childNodes[drawToolbar.childNodes.length - 1]) //removes marker from drawing toolbar

map.on(L.Draw.Event.CREATED, function (e) {
    var type  = e.layerType,
    shape = e.layer,
    color = layer.options.lineColor //color is set to map layer option that wasn't there originally
    shape.options.color = color //set paintbrush color to the color specified by lineColor
    shape.options.fillOpacity = 0 //make inside opaque
    shape.options.opacity = .5

    console.log(shape);
    console.log(layerGroup);
    layerGroup.addLayer(shape) //add shape to layer

    if (type == 'polygon' || type == 'rectangle') {
        addToJson('shape', {
            leaflet_id: shape._leaflet_id,
            type: type,
            latlngs: shape._latlngs[0],
            color: color
        })
    } else if (type == 'polyline') {
        addToJson('shape', {
            leaflet_id: shape._leaflet_id,
            type: type,
            latlngs: shape._latlngs,
            color: color
        })
    }
})


$(document).on("change", "#scene_tags input:radio", function () {
    //set current scene informations
    var sceneName = this.value
    var selectedScene = mapJson.scenes[sceneName]
    document.getElementById("scene_name_input").value = sceneName

    mapJson.brightness = selectedScene.brightness
    mapJson.contrast = selectedScene.contrast
    mapJson.arrows = $.extend(true, [], selectedScene.arrows)
    mapJson.annotations = $.extend(true, [], selectedScene.annotations)
    mapJson.shapes = $.extend(true, [], selectedScene.shapes)

    applyJsonData(mapJson)
})

$(document).on("click", ".glyphicon-chevron-down", function showInfo () {
    //var state = $(this).attr("state")
    var sceneName = $(this).attr("scene")
    var sceneDiv = document.getElementById(sceneName + "_info")
    sceneDiv.className = "panel panel-default"

    var sceneInfo = document.createElement("div")
    sceneInfo.className = "panel-body"

    $(this).attr("class", "glyphicon glyphicon-chevron-up") //replace with an up arrow
    //$(this).attr("state", "show")
    if (sceneName == "current_scene") {
        var scene = mapJson
    } else {
        var scene = mapJson.scenes[sceneName] //scene now points to an object inside of scenes
    }

    var brightnessInfo = "brightness: " + scene.brightness + "<br>"
    sceneInfo.insertAdjacentHTML('beforeend', brightnessInfo)

    var contrastInfo = "contrast: " + scene.contrast + "<br>"
    sceneInfo.insertAdjacentHTML('beforeend', contrastInfo)

    scene.arrows.forEach(function(arrow) {
        var arrowHtml = '<i class="glyphicon glyphicon-remove" scene="' + sceneName + '" leaflet_id="' + arrow.leaflet_id + '" type="arrow"></i> ' + arrow.color + ' arrow <br>'
        sceneInfo.insertAdjacentHTML('beforeend', arrowHtml)
    })

    scene.annotations.forEach(function(annotation) {
        var annotationHtml = '<i class="glyphicon glyphicon-remove" scene="' + sceneName + '" leaflet_id="' + annotation.leaflet_id + '" type="annotation"></i> ' + annotation.text + '<br>'
        sceneInfo.insertAdjacentHTML('beforeend', annotationHtml)
    })

    scene.shapes.forEach(function(shape) {
        var annotationHtml = '<i class="glyphicon glyphicon-remove" scene="' + sceneName + '" leaflet_id="' + shape.leaflet_id + '" type="shape"></i> ' + shape.color + ' ' + shape.type + '<br>'
        sceneInfo.insertAdjacentHTML('beforeend', annotationHtml)
    })

    sceneDiv.appendChild(sceneInfo)
})

$(document).on("click", ".glyphicon-chevron-up", function() {
    this.className = "glyphicon glyphicon-chevron-down"
    this.setAttribute("state", "hide")
    var sceneName = $(this).attr("scene")
    var sceneDiv = document.getElementById(sceneName + "_info")
    sceneDiv.innerHTML = "" //clear html string in scene's info div
    sceneDiv.className = "" //clear box
})

var redrawContents = function(sceneName) {

    var sceneDiv = document.getElementById(sceneName + "_info")
    sceneDiv.innerHTML = "" //clear html string in scene's info div
    sceneDiv.className = "" //clear box
    sceneDiv.className = "panel panel-default"

    var sceneInfo = document.createElement("div")
    sceneInfo.className = "panel-body"

    $(this).attr("class", "glyphicon glyphicon-chevron-up") //replace with an up arrow
    //$(this).attr("state", "show")
    if (sceneName == "current_scene") {
        var scene = mapJson
    } else {
        var scene = mapJson.scenes[sceneName] //scene now points to an object inside of scenes
    }

    var brightnessInfo = "brightness: " + scene.brightness + "<br>"
    sceneInfo.insertAdjacentHTML('beforeend', brightnessInfo)

    var contrastInfo = "contrast: " + scene.contrast + "<br>"
    sceneInfo.insertAdjacentHTML('beforeend', contrastInfo)

    scene.arrows.forEach(function(arrow) {
        var arrowHtml = '<i class="glyphicon glyphicon-remove" scene="' + sceneName + '" leaflet_id="' + arrow.leaflet_id + '" type="arrow"></i> ' + arrow.color + ' arrow <br>'
        sceneInfo.insertAdjacentHTML('beforeend', arrowHtml)
    })

    scene.annotations.forEach(function(annotation) {
        var annotationHtml = '<i class="glyphicon glyphicon-remove" scene="' + sceneName + '" leaflet_id="' + annotation.leaflet_id + '" type="annotation"></i> ' + annotation.text + '<br>'
        sceneInfo.insertAdjacentHTML('beforeend', annotationHtml)
    })

    scene.shapes.forEach(function(shape) {
        var annotationHtml = '<i class="glyphicon glyphicon-remove" scene="' + sceneName + '" leaflet_id="' + shape.leaflet_id + '" type="shape"></i> ' + shape.color + ' ' + shape.type + '<br>'
        sceneInfo.insertAdjacentHTML('beforeend', annotationHtml)
    })

    sceneDiv.appendChild(sceneInfo)


};


$(document).on("click", ".glyphicon-remove", function() {
    //First, find the scene to delete from
    var sceneName = $(this).attr("scene")

    if (sceneName == "current_scene") {
        var scene = mapJson
    } else {
        var scene = mapJson.scenes[sceneName]
    }

    //next, find the element to delete in the scene
    var type = $(this).attr("type")

    switch (type) {
        case "arrow":
        var arr = scene.arrows
        break
        case "annotation":
        var arr = scene.annotations
        break
        case "shape":
        var arr = scene.shapes
        break
    }

    var leaflet_id = $(this).attr("leaflet_id")

    arr.forEach(function(e, i) {
        if (e.leaflet_id == leaflet_id) {
            arr.splice(i, 1) //remove element from array
            setJsonData(mapJson) //reload json

            $('input[name=scene_radio][value=' + sceneName + ']').prop('checked',true);
            $('input[name=scene_radio][value=' + sceneName + ']').trigger('change');

            return
        }
    })
})


$("#clear_current_scene_button").click(function() {

    mapJson.brightness = 50;
    mapJson.contract = 100;
    mapJson.arrows = [];
    mapJson.annotations = [];
    mapJson.shapes = [];

    var sceneInput = document.getElementById("scene_name_input")
    var sceneName = sceneInput.value
    sceneName = sceneName.split(" ").join("_")
    if(sceneName.length > 0) {
        delete mapJson.scenes[sceneName];    
    }
    

    setJsonData(mapJson);
})


$("#add_scene_button").click(function() {
    var sceneInput = document.getElementById("scene_name_input")
    var sceneName = sceneInput.value
    sceneName = sceneName.split(" ").join("_")

    if (!(sceneName in mapJson.scenes)) {
        appendSceneTag(sceneName)
    }

    mapJson.scenes[sceneName] = {
        'brightness': mapJson.brightness,
        'contrast': mapJson.contrast,
        'arrows': $.extend(true, [], mapJson.arrows),
        'annotations': $.extend(true, [], mapJson.annotations),
        'shapes': $.extend(true, [], mapJson.shapes),
    }

    $('input[name=scene_radio][value=' + sceneName + ']').prop('checked',true);
    $('input[name=scene_radio][value=' + sceneName + ']').trigger('change');
    console.log($("i[scene=" + sceneName + "]"));
    if($("i[scene=" + sceneName + "]").hasClass("glyphicon-chevron-up")) {
        redrawContents(sceneName);
    }
    
    console.log(mapJson)
    // sceneInput.value = ""
})

    if(sideCar) {
        setJsonData(sideCar);
    }

};