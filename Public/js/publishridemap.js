 let map;
    let pickupMarker, dropMarker;
    let activeMarker= "pickup";
let routingControl; 
let currentPolyline = null; 

window.addEventListener("load",()=>{ initMap(29.0588, 76.0856);});

   async function geocode(query){
      try {
    const res=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Geocoding request failed");

    let data= await res.json();
    console.log("res obj",res," only json data",data)
     data = data.filter(item => ["city","town","village","administrative"].includes(item.type));
    console.log("Filtered results:", data);
    // console.log(data.length)
    // if(data.length>0){
    //   const addr=data[0].address;
    //   console.log("place:",addr);
    // }
    return data;
  } catch(err){
    console.error("Geocoding error:",err.message);
    return [];
  }
}
    


function initMap(lat,lng){
  if(!map){
    map=L.map("map").setView([lat,lng],9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy;BlaBalCar'
    }).addTo(map);
   }  
   else{   map.setView([lat, lng], 13);}
}

function createDraggableMarker(lat,lng,onDragEnd){
    const marker=L.marker([lat,lng],{draggable:true}).addTo(map);
    marker.on("dragend",async()=>{
    const pos=marker.getLatLng();
    console.log("pos in marker",pos)
    const address=await reverseGeocode(pos.lat,pos.lng);
    //   if(currentPolyline){
    //   map.removeLayer(currentPolyline);
    //   currentPolyline = null;
    // }
    // if(routingControl) {
    //   map.removeControl(routingControl);
    //   routingControl = null;
    // }
        onDragEnd(pos.lat,pos.lng,address);
      });
      return marker;
    }

async function reverseGeocode(lat, lng) {
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data=await res.json();
      return data.display_name||"Unknown location";
}

function setupAutocomplete(inputId, suggestionBoxId,onSelect) {
  const input=document.getElementById(inputId);
  const box = document.getElementById(suggestionBoxId);
      
  input.addEventListener("input", async()=>{
   const query=input.value.trim();
    box.innerHTML="";
    console.log(query)
   if(query.length<3) { 
      box.classList.add("hidden");
      return; }
  try{
    const results= await geocode(query);
    console.log("result of geoco",results)
    results.forEach(result=>{
    const addr = result.address;
    const parts=[];
      if(addr.city) parts.push(addr.city);
      else if(addr.town) parts.push(addr.town);
      else if(addr.village) parts.push(addr.village);
      if (addr.state_district) parts.push(addr.state_district);
      if (addr.state) parts.push(addr.state);

  const short= parts.join(", ");

    const div= document.createElement("div");
    console.log("names",result.display_name)
    //div.textContent=result.display_name;
    div.textContent=short; 

    div.addEventListener("click",()=>{
       input.value=short;
      // input.value=result.display_name;
       box.classList.add("hidden");
      console.log("clicked",result);
      onSelect(result);
     }); 
  box.appendChild(div);
});
  box.classList.remove("hidden");
}
catch(err) { console.error("Geocoding error:", err); }
});
}
   
setupAutocomplete("location","locSugg",(result)=>{
    console.log("res",result)
    initMap(result.lat,result.lon);
    if(pickupMarker){ map.removeLayer(pickupMarker);
       return; }

    pickupMarker =createDraggableMarker(result.lat,result.lon,(lat,lng,address)=>{
    document.getElementById("pickupPoint").value =address;
    document.getElementById("pickupLat").value =lat;
    document.getElementById("pickupLng").value=lng;
        
    document.getElementById("pickup-section").classList.remove("hidden");
    document.getElementById("destination-box").classList.remove("hidden");
   });     
});

setupAutocomplete("destination","desSugg",(result)=>{
   map.setView([result.lat,result.lon],13);
  if(dropMarker) { map.removeLayer(dropMarker);
    return;  }

// let newPickup, newDropoff;

  dropMarker= createDraggableMarker(result.lat,result.lon,(lat,lng,address)=>{
    document.getElementById("dropoffPoint").value= address;
    document.getElementById("dropLat").value=lat;
    document.getElementById("dropLng").value=lng;

    document.getElementById("otherfields").classList.remove("hidden");
    document.getElementById("dropoff-section").classList.remove("hidden");
     const pickupLat=document.getElementById("pickupLat").value;
    const pickupLng =document.getElementById("pickupLng").value;
    const dropLat=document.getElementById("dropLat").value;
  const dropLng=document.getElementById("dropLng").value;

  if(!(pickupLat &&pickupLng && dropLat && dropLng)) return;

  // newPickup=L.marker([pickupLat,pickupLng],{draggable:false}).addTo(map);
  //  newDropoff=L.marker([dropLat,dropLng],{draggable:false}).addTo(map);

  if (pickupMarker && pickupMarker.dragging){
    pickupMarker.dragging.disable();
  }
  if (dropMarker&& dropMarker.dragging){
    dropMarker.dragging.disable();
  }
  // if(currentPolyline){
  //   map.removeLayer(currentPolyline);
  //   currentPolyline = null;
  // }
  // if(routingControl){
  //   map.removeControl(routingControl);
  //   routingControl=null;
  // }

routingControl= L.Routing.control({
    waypoints:[L.latLng(pickupLat,pickupLng), L.latLng(dropLat,dropLng)],
    showAlternatives:true,
    routeWhileDragging:true,
    show:true,
    collapsible:true,
    createMarker: ()=>null,
    lineOptions: { styles: [{color:'grey'}] }
  }).addTo(map);

  routingControl.on("routesfound",(e)=> {
    const routes=e.routes;
    const div=document.getElementById("routeOptions");
    div.innerHTML="";


  const formatTime=s => `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m`;
  const formatDistance = d => d >= 1000 ? (d / 1000).toFixed(2) + ' km' : d + ' m';

  routes.forEach((route, index) => {
    const distanced=route.summary.totalDistance;
   const distance=formatDistance(distanced);
    const timeTime=route.summary.totalTime;
    const time=formatTime(timeTime)

      const label=document.createElement("label");
      label.innerHTML=`<input type="radio" name="route" value="${index}"> Route ${index + 1}${distance} -${time}`;
      div.appendChild(label);
      div.appendChild(document.createElement("br"));
    });

    document.getElementById("routeConfirm").classList.remove("hidden");

    const radios=div.querySelectorAll('input[name="route"]');
    radios.forEach((radio)=>{
      radio.addEventListener("change",()=>{
        const selectedIndex=radio.value;
        console.log("selctedind",selectedIndex)
        const selectedRoute=routes[selectedIndex];
        console.log("route to drawpoly on",selectedRoute)

        if(currentPolyline) { map.removeLayer(currentPolyline); }

        currentPolyline =L.polyline(selectedRoute.coordinates, { color:"blue"}).addTo(map);
        map.fitBounds(currentPolyline.getBounds());
        document.getElementById("routeIndex").value=selectedIndex;
      });
    });
  });
  })
});


document.getElementById("rideForm").addEventListener("submit", async(e)=>{
  e.preventDefault();

  const errorDiv=document.getElementById("errorMessage");

  const formData= new FormData(e.target);
  const data =Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/create-ride", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(data)
    });

    const result=await res.json();
   console.log("res",result)
    if(!res.ok){ errorDiv.textContent= result.error || "An error occurred.";} 
    else{
       window.location.href=result.redirectTo;
    }
  } catch(err){
    errorDiv.textContent= "Network error. Try again.";
  }
});


