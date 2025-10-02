function populateBerths(berthFile){
  Papa.parse(berthFile, {
    download: true,
    header: true,
    complete: (results) => {
      renderBerths(results.data);
    }
  });
};

function renderBerths(berths) {
  const container = document.getElementById("berths");
  container.innerHTML = ""; // καθαρισμός παλιών

  berths    
    .filter(b => b.Berth && b.Length && b.Draft) // κρατάμε μόνο έγκυρα rows
    .forEach(berth => {
      const berthDiv = document.createElement("div");
      berthDiv.className = "berth";

      // εσωτερικό container για name + size
      const info = document.createElement("div");
      info.className = "berth-info";

      const name = document.createElement("div");
      name.className = "berth-name";
      name.textContent = "B-" + berth.Berth.padStart(2, "0"); 

      const size = document.createElement("div");
      size.className = "berth-size";
      size.textContent = `(${berth.Length} × ${berth.Draft})`;

      info.appendChild(name);
      info.appendChild(size);

      berthDiv.appendChild(info);
      container.appendChild(berthDiv);
    });
}


function populateShips(shipFile){
  Papa.parse(shipFile, {
    download: true,
    header: true,
    complete: (results) => {
      renderShips(results.data);
    }
  });
};

function renderShips(ships) {
  const container = document.getElementById("ships");
  container.innerHTML = ""; // καθαρισμός παλιών

  ships    
    .filter(s => s.Ship && s.Length && s.Draft) // κρατάμε μόνο έγκυρα rows
    .forEach(ship => {

      const shipDiv = document.createElement("div");
      shipDiv.className = "ship";
      shipDiv.id = "ship-" + ship.Ship.padStart(2, "0");

      // εσωτερικό container για name + size
      const info = document.createElement("div");
      info.className = "ship-info";

      const name = document.createElement("div");
      name.className = "ship-name";
      name.textContent = "S" + ship.Ship.padStart(2, "0"); 

      const size = document.createElement("div");
      size.className = "ship-size";
      size.textContent = `Length x Draft (m): ${ship.Length} x ${ship.Draft}`;

      const ETA = document.createElement("div");
      ETA.className = "ship-eta";
      ETA.textContent = `ETA (h): ${ship.ETA}`;

      const RTD = document.createElement("div");
      RTD.className = "ship-rtd";
      RTD.textContent = `RTD (h): ${Math.round(ship.RTD)}`;

      info.appendChild(name);
      info.appendChild(size);
      info.appendChild(ETA);
      info.appendChild(RTD);

      shipDiv.appendChild(info);
      container.appendChild(shipDiv);
    });
}


function renderSolutionOverlay(solutionFile, containerId = "berths") {
  Papa.parse(solutionFile, {
    download: true,
    header: true,
    complete: (solutionResults) => {
      const ships = solutionResults.data.filter(
        s => s.Ship && s.Berth && s.MooringTime && s.HandlingTime
      );

      if (ships.length === 0) return;

      const container = document.getElementById(containerId);

      // --- CLEAR PREVIOUS SHIPS ---
      Array.from(container.children).forEach(berthDiv => {
        const track = berthDiv.querySelector(".berth-gantt-track");
        if (track) {
          track.innerHTML = ""; // remove all chips and tooltips
        }
      });

      // Determine max time across all ships
      const maxTime = Math.max(...ships.map(s => parseFloat(s.MooringTime) + parseFloat(s.HandlingTime)));

      renderTimeAxis(maxTime);
      
      ships.forEach(ship => {
        // Find the existing berth track
        const berthDiv = Array.from(container.children).find(
          b => b.querySelector(".berth-name")?.textContent === "B-" + ship.Berth.padStart(2, "0")
        );

        if (!berthDiv) return;

        let track = berthDiv.querySelector(".berth-gantt-track");
        if (!track) {
          track = document.createElement("div");
          track.className = "berth-gantt-track";
          berthDiv.appendChild(track);
        }


        // Create ship chip
        const chip = document.createElement("div");
        chip.className = "ship-chip-gantt";
        chip.textContent = "S" + ship.Ship.padStart(2, "0");

        const leftPercent = (parseFloat(ship.MooringTime) / maxTime) * 100;
        const widthPercent = (parseFloat(ship.HandlingTime) / maxTime) * 100;
        chip.style.left = leftPercent + "%";
        chip.style.width = widthPercent + "%";

        // Create tooltip
        const tooltip = document.createElement("div");
        tooltip.className = "ship-tooltip";
        const departure = parseFloat(ship.MooringTime) + parseFloat(ship.HandlingTime);
        tooltip.textContent = `S${ship.Ship.padStart(2, "0")}: Mooring: ${ship.MooringTime}, Handling: ${Math.round(ship.HandlingTime)}, Departure: ${departure}`;
        document.body.appendChild(tooltip);   // ✅ instead of track.appendChild

        chip.addEventListener("click", () => {
          const target = document.getElementById("ship-" + ship.Ship.padStart(2, "0"));
          if (target) {
            // Scroll στο arrival panel
            target.scrollIntoView({ behavior: "smooth", block: "center" });

            // Highlight προσωρινά για να ξεχωρίζει
            target.classList.add("highlight-ship");
            setTimeout(() => target.classList.remove("highlight-ship"), 2000);
          }
        });

        chip.addEventListener("mouseenter", () => {
          const chipRect = chip.getBoundingClientRect();
          tooltip.style.opacity = 1;
          tooltip.style.top = (window.scrollY + chipRect.top - 15) + "px";   // above chip
          tooltip.style.left = (window.scrollX + chipRect.left + chipRect.width / 2) + "px";
          tooltip.style.transform = "translateX(-50%)";
        });

      chip.addEventListener("mouseleave", () => {
        tooltip.style.opacity = 0;
      });


        track.appendChild(chip);
      });

      const scenario = getSelectedScenario();
      const algo = getSelectedAlgorithm();
      if (algo != "exact"){

        const gapPercent = `${((times_and_gaps[scenario][algo]["obj"] - times_and_gaps[scenario]["exact"]["obj"]) 
         / times_and_gaps[scenario]["exact"]["obj"] * 100).toFixed(2)}%`;

        document.getElementById('heuristicRuntime').innerHTML = times_and_gaps[scenario][algo]["time"] + "s";
        document.getElementById('heuristicObjValue').innerHTML = times_and_gaps[scenario][algo]["obj"];
        document.getElementById("heuristicGap").innerHTML = gapPercent;        
        document.getElementById('exactRuntime').innerHTML = times_and_gaps[scenario]["exact"]["time"] + "s";
        document.getElementById('exactObjVal').innerHTML = times_and_gaps[scenario]["exact"]["obj"];
    
        document.querySelectorAll('.info-block-exact').forEach(element => element.style.visibility = "visible");
        document.querySelectorAll('.info-block-heuristic').forEach(element => element.style.visibility = "visible");     
      }
      else{
        document.querySelectorAll('.info-block-heuristic').forEach(element => element.style.visibility = "hidden");
        document.getElementById('exactRuntime').innerHTML = times_and_gaps[scenario]["exact"]["time"] + "s";
        document.getElementById('exactObjVal').innerHTML = times_and_gaps[scenario]["exact"]["obj"];   
        document.querySelectorAll('.info-block-exact').forEach(element => element.style.visibility = "visible");     
      }

      



      // Mark berths with no ships
      Array.from(container.children).forEach(berthDiv => {
        const track = berthDiv.querySelector(".berth-gantt-track");
        if (!track || track.children.length === 0) {
          berthDiv.classList.add("empty-berth");
        } else {
          berthDiv.classList.remove("empty-berth");
        }
      });

    }
  });
}


function getSelectedAlgorithm() {
  const selectElement = document.getElementById("algSelect");
  const selectedValue = selectElement.value;       // gets the value attribute of the selected option
  const selectedText = selectElement.options[selectElement.selectedIndex].text; // gets the visible text

  return selectedValue;  // or return an object {value, text} if you want both
}

function getSelectedScenario() {
  const selectElement = document.getElementById("scenarioSelect");
  const selectedValue = selectElement.value;       // gets the value attribute of the selected option
  const selectedText = selectElement.options[selectElement.selectedIndex].text; // gets the visible text

  return selectedValue;  // or return an object {value, text} if you want both
}

document.getElementById("runBtn").addEventListener("click", () => {
  const algo = getSelectedAlgorithm();
  const scenario = getSelectedScenario();
  shipFile = `Datasets/${scenario}-ships.csv` ;
  berthFile = `Datasets/${scenario}-berths.csv`;
  populateShips(shipFile);
  populateBerths(berthFile);

  renderSolutionOverlay(`Datasets/${scenario}-${algo}-solution.csv`);



});

function renderTimeAxis(maxTime, ticks = 10) {
  let axis = document.getElementById("time-axis");

  // If it doesn't exist yet, create and place it in the right spot
  if (!axis) {
    axis = document.createElement("div");
    axis.id = "time-axis";

    // Find parent (port-panel) and insert before berths-wrapper
    const panel = document.querySelector(".port-panel");
    const wrapper = document.querySelector(".berths-wrapper");
    panel.insertBefore(axis, wrapper); // 👈 puts axis exactly where you had it commented
  }

  // Clear old ticks
  axis.innerHTML = "";

  const axisWidth = axis.offsetWidth;

  for (let i = 0; i <= ticks; i++) {
    const time = Math.round((i / ticks) * maxTime);
    const tick = document.createElement("div");
    tick.className = "time-tick";
    tick.style.left = `${(i / ticks) * 100}%`;
    tick.textContent = time;
    axis.appendChild(tick);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("infoArrivals");
  const tooltip = document.getElementById("arrivalsTooltip");

  if (!btn || !tooltip) {
    // αν κάποιο στοιχείο λείπει, απλά δεν κάνουμε τίποτα και αποφεύγουμε λάθη
    console.warn("Info button or tooltip not found.");
    return;
  }

  // Toggle tooltip όταν πατηθεί το κουμπί
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // να μην ενεργοποιήσει το global click handler
    tooltip.classList.toggle("visible");
    const visible = tooltip.classList.contains("visible");
    tooltip.setAttribute("aria-hidden", visible ? "false" : "true");
  });

  // Κλείσιμο όταν ο χρήστης κάνει κλικ εκτός του tooltip
  document.addEventListener("click", (e) => {
    if (!tooltip.classList.contains("visible")) return;
    if (!tooltip.contains(e.target) && e.target !== btn) {
      tooltip.classList.remove("visible");
      tooltip.setAttribute("aria-hidden", "true");
    }
  });

  // Κλείσιμο με Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && tooltip.classList.contains("visible")) {
      tooltip.classList.remove("visible");
      tooltip.setAttribute("aria-hidden", "true");
    }
  });
});



//Disable runBtn and addVesselBtn on page load. Can be clicked only when an algorithm and a scenario have been chosen.
document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("runBtn");
  const addVesselBtn = document.getElementById("addVesselBtn");
  const algSelect = document.getElementById("algSelect");
  const scenarioSelect = document.getElementById("scenarioSelect");

  runBtn.disabled = true;
  addVesselBtn.disabled = true;

  function updateRunBtnAndAddVesselBtnState() {
    const algoSelected = algSelect.selectedIndex > 0;
    const scenarioSelected = scenarioSelect.selectedIndex > 0;
    runBtn.disabled = !(algoSelected && scenarioSelected);
    if (algSelect.value === "exact") {
      addVesselBtn.disabled = true;
    }
    else{
        addVesselBtn.disabled = !(algoSelected && scenarioSelected);
    }
}


  algSelect.addEventListener("change", updateRunBtnAndAddVesselBtnState);
  scenarioSelect.addEventListener("change", updateRunBtnAndAddVesselBtnState);
});


function added_scenario(scenario, new_scenario, algo, ship_added){
    shipFile = `Datasets/${new_scenario}-ships.csv` ;
    berthFile = `Datasets/${new_scenario}-berths.csv`;

    //PopulateShips for adding a vessel.
    Papa.parse(shipFile, {
      download: true,
      header: true,
      complete: (results) => {
        renderShipsWithNewShip(results.data,ship_added);
      }
    });
    
    populateBerths(berthFile);

    let changedShipsStore = {}; // global or outer-scope object

    let old_solution =  `Datasets/${scenario}-${algo}-solution.csv`
    let new_solution =  `Datasets/${new_scenario}-${algo}-solution.csv`

    console.log(old_solution); console.log(new_solution);

    compareSchedules(old_solution, new_solution, ship_added, (changes) => {
      // Store it in an object
      changedShipsStore = {
        newShipId: ship_added,
        changes: changes
      };

      console.log("Stored changed ships:", changedShipsStore);
      renderSolutionOverlayWithChanges(
        new_solution,
        changedShipsStore.changes, // array of ships that changed
        "berths",
        ship_added
      );
    });}


document.getElementById("addVesselBtn").addEventListener("click", () => {

  const algo = getSelectedAlgorithm();
  const scenario = getSelectedScenario();

  let new_scenario = add_one_scenario[scenario];

  if (scenario === "20-10-168-1"){
    added_scenario(scenario, new_scenario, algo, 12);
  }
  else if (scenario === "25-10-168-5"){
    added_scenario(scenario,new_scenario, algo, 9);
  }
  else{
    added_scenario(scenario,new_scenario, algo, 4);
  }
});


function compareSchedules(oldCsvFile, newCsvFile, new_ship, callback) {
  // Parse both CSVs in parallel
  Papa.parse(oldCsvFile, { download: true, header: true, complete: parseOld });
  
  let oldData, newData;

  function parseOld(results) {
    oldData = results.data;
    Papa.parse(newCsvFile, { download: true, header: true, complete: parseNew });
  }

  function parseNew(results) {
    newData = results.data;

    const changedShips = [];

    const newShipId = Number(new_ship);

    newData.forEach((newShip, index) => {
      const shipId = Number(newShip.Ship);

      if (!shipId) return;

      if (shipId < newShipId) {
        const oldShip = oldData.find(s => Number(s.Ship) === shipId);
        if (!oldShip) return;

        if (
          newShip.Berth !== oldShip.Berth ||
          Number(newShip.MooringTime) !== Number(oldShip.MooringTime) ||
          Number(newShip.HandlingTime) !== Number(oldShip.HandlingTime)
        ) {
          changedShips.push({ Ship: shipId, type: "modified" });
        }
      } else if (shipId === newShipId) {
        changedShips.push({ Ship: shipId, type: "new" });
      } else if (shipId > newShipId) {
        const oldShip = oldData.find(s => Number(s.Ship) === shipId - 1);
        if (!oldShip) return;

        if (
          newShip.Berth !== oldShip.Berth ||
          Number(newShip.MooringTime) !== Number(oldShip.MooringTime) ||
          Number(newShip.HandlingTime) !== Number(oldShip.HandlingTime)
        ) {
          changedShips.push({ Ship: shipId, type: "shifted" });
        }
      }
    });

    callback(changedShips);
  }
}


function renderSolutionOverlayWithChanges(solutionFile, changedShips = [], containerId = "berths", new_ship) {
  Papa.parse(solutionFile, {
    download: true,
    header: true,
    complete: (solutionResults) => {
      const ships = solutionResults.data.filter(
        s => s.Ship && s.Berth && s.MooringTime && s.HandlingTime
      );

      if (ships.length === 0) return;

      const container = document.getElementById(containerId);

      // --- CLEAR PREVIOUS SHIPS ---
      Array.from(container.children).forEach(berthDiv => {
        const track = berthDiv.querySelector(".berth-gantt-track");
        if (track) track.innerHTML = ""; // remove all chips and tooltips
      });

      const maxTime = Math.max(...ships.map(s => parseFloat(s.MooringTime) + parseFloat(s.HandlingTime)));

      renderTimeAxis(maxTime);
      
      ships.forEach(ship => {
        const berthDiv = Array.from(container.children).find(
          b => b.querySelector(".berth-name")?.textContent === "B-" + ship.Berth.padStart(2, "0")
        );

        if (!berthDiv) return;

        let track = berthDiv.querySelector(".berth-gantt-track");
        if (!track) {
          track = document.createElement("div");
          track.className = "berth-gantt-track";
          berthDiv.appendChild(track);
        }

        // Create ship chip
        const chip = document.createElement("div");
        chip.className = "ship-chip-gantt";
        chip.textContent = "S" + ship.Ship.padStart(2, "0");

        const shipId = Number(ship.Ship);
        if (!Number.isFinite(shipId)) return; // skip invalid ships

        const new_ship_id = Number(new_ship);

        if (shipId > new_ship_id) { //12
          chip.textContent = "S" + String(shipId - 1).padStart(2, "0");
        }

        // Check if this ship is in the changedShips array
        // const isChanged = changedShips.some(cs => Number(cs.Ship) === Number(ship.Ship));

        const changedShip = changedShips.find(cs => Number(cs.Ship) === Number(ship.Ship));

        if (changedShip) {
          chip.style.backgroundColor = "#AD5B0D"; // orange for modified
          chip.style.border = "#AD5B0D" ;

          if (changedShip.type === "new") 
            chip.textContent = "New";
          else if (changedShip.type === "shifted") // decrement displayed ship ID
            chip.textContent = "S" + String(Number(ship.Ship) - 1).padStart(2, "0");
  
        }

        const leftPercent = (parseFloat(ship.MooringTime) / maxTime) * 100;
        const widthPercent = (parseFloat(ship.HandlingTime) / maxTime) * 100;
        chip.style.left = leftPercent + "%";
        chip.style.width = widthPercent + "%";

        // Create tooltip
        const tooltip = document.createElement("div");
        tooltip.className = "ship-tooltip";
        const departure = parseFloat(ship.MooringTime) + parseFloat(ship.HandlingTime);
        tooltip.textContent = `S${ship.Ship.padStart(2, "0")}: Mooring: ${ship.MooringTime}, Handling: ${Math.round(ship.HandlingTime)}, Departure: ${departure}`;        
        

        if (shipId > new_ship_id) {
          tooltip.textContent = "S" + String(Number(ship.Ship) - 1).padStart(2, "0") + ": Mooring: " + ship.MooringTime + ", Handling: " + Math.round(ship.HandlingTime) + ", Departure: " + departure;
        }
        else if (shipId == new_ship_id){
            tooltip.textContent = "S new: Mooring: " + ship.MooringTime + ", Handling: " + Math.round(ship.HandlingTime) + ", Departure: " + departure;
        }

        document.body.appendChild(tooltip);   

        chip.addEventListener("click", () => {
          const target = document.getElementById("ship-" + ship.Ship.padStart(2, "0"));
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            if (changedShip && changedShip.type === "new"){
              target.classList.add("highlight-new-ship")
              setTimeout(() => target.classList.remove("highlight-new-ship"), 2000);
            }else{
              target.classList.add("highlight-ship");
              setTimeout(() => target.classList.remove("highlight-ship"), 2000);
            }
          }
        });

        chip.addEventListener("mouseenter", () => {
          const chipRect = chip.getBoundingClientRect();
          tooltip.style.opacity = 1;
          tooltip.style.top = (window.scrollY + chipRect.top - 15) + "px";   // above chip
          tooltip.style.left = (window.scrollX + chipRect.left + chipRect.width / 2) + "px";
          tooltip.style.transform = "translateX(-50%)";
        });


        chip.addEventListener("mouseleave", () => {
          tooltip.style.opacity = 0;
        });

        track.appendChild(chip);
      });
    

      const scenario =  add_one_scenario[getSelectedScenario()];
      const algo = getSelectedAlgorithm();
      
      document.getElementById('heuristicRuntime').innerHTML = times_and_gaps[scenario][algo]["time"] + "s";
      document.getElementById('heuristicObjValue').innerHTML = times_and_gaps[scenario][algo]["obj"];
      document.getElementById("heuristicGap").innerHTML = "--%";
  
      document.querySelectorAll('.info-block-exact').forEach(element => element.style.visibility = "hidden");
      document.querySelectorAll('.info-block-heuristic').forEach(element => element.style.visibility = "visible");     
      

      // Mark empty berths
      Array.from(container.children).forEach(berthDiv => {
        const track = berthDiv.querySelector(".berth-gantt-track");
        if (!track || track.children.length === 0) {
          berthDiv.classList.add("empty-berth");
        } else {
          berthDiv.classList.remove("empty-berth");
        }
      });
    }
  });
}

function renderShipsWithNewShip(ships, newShipId) {
  const container = document.getElementById("ships");
  container.innerHTML = ""; // clear previous ships

  ships
    .filter(s => s.Ship && s.Length && s.Draft)
    .forEach(ship => {
      const shipDiv = document.createElement("div");
      shipDiv.className = "ship";
      shipDiv.id = "ship-" + ship.Ship.padStart(2, "0");

      // Ship info container
      const info = document.createElement("div");
      info.className = "ship-info";

      const name = document.createElement("div");
      name.className = "ship-name";

      // Determine display text and styling
      let displayId = Number(ship.Ship);
      if (displayId === newShipId) {
        name.textContent = "S" + " new";
        name.style.color = "#AD5B0D";
        shipDiv.style.border = "1px solid #AD5B0D"; 
      }
      else if (displayId > newShipId) {
        displayId -= 1;
        name.textContent = "S" + String(displayId).padStart(2, "0");
      }
      else {
        name.textContent = "S" + String(displayId).padStart(2, "0");
      }

      const size = document.createElement("div");
      size.className = "ship-size";
      size.textContent = `Length x Draft (m): ${ship.Length} x ${ship.Draft}`;

      const ETA = document.createElement("div");
      ETA.className = "ship-eta";
      ETA.textContent = `ETA (h): ${ship.ETA}`;

      const RTD = document.createElement("div");
      RTD.className = "ship-rtd";
      RTD.textContent = `RTD (h): ${Math.round(ship.RTD)}`;

      info.appendChild(name);
      info.appendChild(size);
      info.appendChild(ETA);
      info.appendChild(RTD);

      shipDiv.appendChild(info);
      container.appendChild(shipDiv);
    });
}


const times_and_gaps = {
  "20-10-168-1": {
    exact: {
      time: 4,
      obj: 784
    },
    nn: {
      time: 0.00001,
      obj: 880
    },
    insertion: {
      time: 0.00002,
      obj: 836
    },
    qd_insertion: {
      time: 0.00001,
      obj: 836
    },
    csa: {
      time: 0.1,
      obj: 799
    },
    ga: {
      time: 0.03,
      obj: 793
    },
    alns: {
      time: 0.02,
      obj: 784
    }
  },
  "25-10-168-5": {
    exact: {
      time: 14,
      obj: 718
    },
    nn: {
      time: 0.00001,
      obj: 880
    },
    insertion: {
      time: 0.00009 ,
      obj: 744 
    },
    qd_insertion: {
      time: 0.00002,
      obj: 758 
    },
    csa: {
      time: 0.12,
      obj: 742 
    },
    ga: {
      time: 0.047  ,
      obj: 744
    },
    alns: {
      time: 0.039 ,
      obj: 732 
    }
  },
  "30-10-168-2": {
    exact: {
      time: 26.26,
      obj: 886
    },
    nn: {
      time: 0.00001,
      obj: 1035 
    },
    insertion: {
      time: 0.00011 ,
      obj: 944
    },
    qd_insertion: {
      time: 0.00002,
      obj: 944
    },
    csa: {
      time: 0.23  ,
      obj: 893
    },
    ga: {
      time: 0.064 ,
      obj: 944 
    },
    alns: {
      time: 0.059 ,
      obj: 886
    }
  },
  "21-10-168-1":{
    exact: {
      time: 0,
      obj: 0
    },
    nn: {
      time: 0.00001,
      obj: 951
    },
    insertion: {
      time: 0.00002,
      obj: 849
    },
    qd_insertion: {
      time: 0.00001,
      obj: 849
    },
    csa: {
      time: 0.11,
      obj: 812
    },
    ga: {
      time: 0.037,
      obj: 812
    },
    alns: {
      time: 0.02,
      obj: 797
    } 
  },
  "26-10-168-5":{
    exact: {
      time: 0,
      obj: 0
    },
    nn: {
      time: 0.00001,
      obj: 910
    },
    insertion: {
      time: 0.00013,
      obj: 771
    },
    qd_insertion: {
      time: 0.00002,
      obj: 785
    },
    csa: {
      time: 0.12545,
      obj: 771
    },
    ga: {
      time: 0.048,
      obj: 771
    },
    alns: {
      time: 0.043,
      obj: 762
    } 
  },
  "31-10-168-2": {
    exact: {
      time: 0,
      obj: 0
    },
    nn: {
      time: 0.00001,
      obj: 1165
    },
    insertion: {
      time: 0.00011,
      obj: 1023
    },
    qd_insertion: {
      time: 0.00002,
      obj: 1023
    },
    csa: {
      time: 0.24,
      obj: 997
    },
    ga: {
      time: 0.067,
      obj: 997
    },
    alns: {
      time: 0.059,
      obj: 965
    }
  }  
};

add_one_scenario = {
  "20-10-168-1": "21-10-168-1",
  "25-10-168-5": "26-10-168-5",
  "30-10-168-2": "31-10-168-2"
}

