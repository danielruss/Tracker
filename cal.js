import localforage from 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/+esm'

let calendarDate = new Date();
let currentDate = new Date().toDateString();

const allSymptoms = [];
const symptomMap = new Map();
const symptomCache = await localforage.createInstance({
    name: "Tracker",
    storeName: "symptomCache"
})

function updateCalendar(date) {
    let month = date.getMonth();
    let day1 = new Date(date.getFullYear(), month, 1);
    let dayn = new Date(date.getFullYear(), month + 1, 0);
    //let monthName = day1.toLocaleString('default', { month: 'long', year: 'numeric' });

    let dateGrid = document.querySelector('.date-grid');
    dateGrid.innerHTML = '';
    for (let i = 1; i <= dayn.getDate(); i++) {
        let dateElement = document.createElement('div');
        dateElement.classList.add('date');
        let numElement = document.createElement('span');
        numElement.innerText = i;
        dateElement.insertAdjacentElement("beforeend",numElement);
        dateElement.dataset.date = new Date(day1.getFullYear(), day1.getMonth(), i).toDateString();
        if ( symptomMap.has(dateElement.dataset.date) ) {
            let iconElement = document.createElement('span');
            iconElement.innerHTML = `<i class="bi bi-journal-bookmark-fill"></i>`
            dateElement.insertAdjacentElement("beforeend",iconElement);
        }
        dateElement.addEventListener('click', function (event) {
            currentDate = event.target.dataset.date;
            // if you click on the child span it causes a problem.
            if (!currentDate){
                currentDate = event.target.parentElement.dataset.date;
            }
            showDay(currentDate);
        });
        dateGrid.appendChild(dateElement);
    }
    const firstChild = document.querySelector('.date-grid :nth-child(1)');
    if (firstChild) {
        firstChild.style.gridColumnStart = day1.getDay() + 1;
    }

    showDay(date.toDateString())
}

function showDay(date) {
    console.log(`get day for ${date}`)

    let today = new Date()
    let dateGrid = document.querySelector('.date-grid');
    dateGrid.querySelector(`[data-date="${today.toDateString()}"]`)?.classList.add('today');
    dateGrid.querySelectorAll('.selection').forEach( (el) => el.classList.remove("selection"));
    if (today.toDateString() != date ){
        dateGrid.querySelector(`[data-date="${date}"]`)?.classList.add('selection');
    }
    
    let symptoms = allSymptoms.filter( (obj) => {
        return obj.date == date
    });
    console.table(symptoms)
    buildTable(symptoms);
}

function buildTable(symptoms,search=false) {
    let table = document.querySelector("table");
    let symptomTable = document.getElementById("symptomList");
    let symptomHeader = document.getElementById("headerRow");
    
    // set the header
    symptomHeader.innerText=""
    if (!search){
        let cell = symptomHeader.insertCell()
        cell.outerHTML = `<th>Symptoms for ${currentDate}</th>`   
    } else {
        let cell = symptomHeader.insertCell()
        cell.outerHTML = `<th>Date</th>`
        cell = symptomHeader.insertCell()
        cell.outerHTML = `<th>Symptoms</th>`
    }

    // clear the body...
    symptomTable.innerHTML="";
    symptoms.forEach( (symptom) => {
        let newRow = symptomTable.insertRow();
        if (search){
            let dateCell = newRow.insertCell();
            dateCell.innerText = symptom.date;
        }
        let symptomCell = newRow.insertCell();
        symptomCell.innerHTML = symptom.symptom;
        console.log(`... add symbtom ${symptom.symptom}`)
    })

    // hide or show No symptoms...
    console.log(symptoms.length>0)
    let noSymptomsRow = document.getElementById("noSymptoms");
    if (symptoms.length>0){
        noSymptomsRow.classList.add("d-none")
    } else {
        noSymptomsRow.classList.remove("d-none")
    }
}

async function loadSymptomsFromIDB(){
    await symptomCache.iterate( (symptoms,date,indx) => {
        symptomMap.set(date,symptoms)
        symptoms.forEach( s=> allSymptoms.push({date:date,symptom:s}))
        addToDataList(symptoms)
    }).then( ()=>{
        console.log(symptomMap);
        console.log(allSymptoms)
    })
}

function addSymptom(symptomObj){
    const {date, symptom} = symptomObj;
    if ( !symptomMap.has(date) ) {
        symptomMap.set(date,[])
    }
    symptomMap.get(date).push(symptom);
    allSymptoms.push(symptomObj)
    
    symptomCache.setItem(date,symptomMap.get(date))
}

document.addEventListener('DOMContentLoaded', async function () {
    await loadSymptomsFromIDB()
 
    let monthInput = document.getElementById('monthInput');
    monthInput.value = calendarDate.toISOString().slice(0, 7);
    updateCalendar(calendarDate);

    document.getElementById('monthInput').addEventListener('change', function () {
        let monthVal = document.getElementById('monthInput').value;
        let [year, month] = monthVal.split('-');
        calendarDate = new Date(year, month - 1);
        updateCalendar(calendarDate);
    });

    document.getElementById("addSymptom").addEventListener("click", function () {
        console.log(currentDate);
        let symptom = document.getElementById("symptom").value;
        if (symptom) {
            let obj = {
                date: currentDate,
                symptom: symptom
            }
            addSymptom(obj)

            // Add the symptom to the datalist for future use
            addToDataList(symptom)
            updateCalendar(new Date(currentDate));
            
            document.getElementById("symptom").value = "";

        }
    });

    document.getElementById("searchBTN").addEventListener("click",searchText)

});

function addToDataList(symptom) {
    const prevlist = document.getElementById("previousSymptoms");
    const symptomSet = new Set(symptom);
    symptomSet.forEach((s) => {
        if (!prevlist.querySelector(`option[value="${symptom}"]`)) {
            let option = document.createElement("option");
            option.value = s;
            prevlist.appendChild(option);
        }
    })
}

function searchText(){
    const searchInput = document.getElementById("searchInput");
    let searchText = searchInput.value;
    // handle the search text is null case...
    if (!searchText?.length > 0){
        console.log(`search text is null or empty: >${searchText}<`)
        return
    }
    console.log(`.... SEARCH FOR ${searchText}.... `)
    let found = allSymptoms.filter( (obj)=> obj.symptom.includes(searchText))
                          .sort((a, b) => new Date(a.date) - new Date(b.date));
    console.table(found)
    buildTable(found,true)
    searchInput.value="";   
}