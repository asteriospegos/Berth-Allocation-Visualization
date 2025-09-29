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
        tooltip.textContent = `S${ship.Ship.padStart(2, "0")} ---> Mooring: ${ship.MooringTime}, Handling: ${Math.round(ship.HandlingTime)}, Departure: ${departure}`;
        track.appendChild(tooltip);

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

        // Hover events
        chip.addEventListener("mouseenter", () => {
          tooltip.style.opacity = 1;
          // Position above the chip
          const chipRect = chip.getBoundingClientRect();
          const trackRect = track.getBoundingClientRect();
          tooltip.style.left = (chip.offsetLeft + chip.offsetWidth / 2) + "px";
          tooltip.style.top = (chip.offsetTop - 25) + "px";
          tooltip.style.transform = "translateX(-50%)";
        });

        chip.addEventListener("mouseleave", () => {
          tooltip.style.opacity = 0;
        });

        track.appendChild(chip);
      });

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
  populateShips(shipFile)
  populateBerths(berthFile);

  renderSolutionOverlay(`Datasets/${scenario}-${algo}-solution.csv`);
});




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



document.getElementById("addVesselBtn").addEventListener("click", () => {
  const algo = getSelectedAlgorithm();
  const scenario = getSelectedScenario();

  if (scenario === "20-10-168-1"){

    
    let new_scenario = "21-10-168-1";
    
    shipFile = `Datasets/${new_scenario}-ships.csv` ;
    berthFile = `Datasets/${new_scenario}-berths.csv`;
    // populateShips(shipFile)
    //PopulateShips for adding a vessel.
    Papa.parse(shipFile, {
      download: true,
      header: true,
      complete: (results) => {
        renderShipsWithNewShip(results.data,12);
      }
    });
    
    populateBerths(berthFile);

    let changedShipsStore = {}; // global or outer-scope object

    let old_solution =  `Datasets/${scenario}-${algo}-solution.csv`
    let new_solution =  `Datasets/${new_scenario}-${algo}-solution.csv`

    console.log(old_solution); console.log(new_solution);

    compareSchedules(old_solution, new_solution, 12, (changes) => {
      // Store it in an object
      changedShipsStore = {
        newShipId: 12,
        changes: changes
      };

      console.log("Stored changed ships:", changedShipsStore);
      renderSolutionOverlayWithChanges(
        new_solution,
        changedShipsStore.changes // array of ships that changed
      );
    });

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


function renderSolutionOverlayWithChanges(solutionFile, changedShips = [], containerId = "berths") {
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

        if (shipId > 12) {
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
        tooltip.textContent = `S${ship.Ship.padStart(2, "0")} ---> Mooring: ${ship.MooringTime}, Handling: ${Math.round(ship.HandlingTime)}, Departure: ${departure}`;        
        
        // if ( changedShip && changedShip.type === "shifted")



        if (shipId > 12) {
          tooltip.textContent = "S" + String(Number(ship.Ship) - 1).padStart(2, "0") + " ---> Mooring: " + ship.MooringTime + ", Handling: " + Math.round(ship.HandlingTime) + ", Departure: " + departure;
        }
        else if (shipId == 12){
            tooltip.textContent = "S new" + " ---> Mooring: " + ship.MooringTime + ", Handling: " + Math.round(ship.HandlingTime) + ", Departure: " + departure;
        }


        track.appendChild(tooltip);

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
          tooltip.style.opacity = 1;
          tooltip.style.left = (chip.offsetLeft + chip.offsetWidth / 2) + "px";
          tooltip.style.top = (chip.offsetTop - 25) + "px";
          tooltip.style.transform = "translateX(-50%)";
        });

        chip.addEventListener("mouseleave", () => {
          tooltip.style.opacity = 0;
        });

        track.appendChild(chip);
      });

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

