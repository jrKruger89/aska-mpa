import { _db } from "./firebase-service.js";
import { showLoader } from "./loader-component.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.4.1/firebase-firestore.js";

let _selectedEventId = "";

export default class Event {
  constructor() {
    this.eventRef = collection(_db, "events");
    this.readData();
  }

  readData() {
    // ========== READ ==========
    // watch the database ref for changes
    onSnapshot(this.eventRef, (snapshot) => {
      // mapping snapshot data from firebase in to user objects
      this.events = snapshot.docs.map((doc) => {
        const event = doc.data();
        event.id = doc.id;
        return event;
      });
      if (location.pathname.includes("kalender.html")) {
        this.sortByDate(this.events)
        this.appendEvents(this.events);
        this.filterEvents();
        showLoader(false);
      } else if (location.pathname.includes("admin.html")) {
        append_edit_calender(this.events);
        showLoader(false);
      }
    });
  }

  sortByDate(events) {
    const sorter = (a, b) => {
      return new Date(b.date) - new Date(a.date);
    }
    events.sort(sorter);
  };

  

  // append events to the DOM
  appendEvents(events) {
    let htmlTemplate = "";
    for (const event of events) {
      htmlTemplate += /*html*/ `
    <article class="article_content">
      <p>${new Date(event.date).toLocaleDateString('da-dk')}</p>
      <div class="whitespace"></div>
      <p>${event.name}</p>
      <div class="whitespace"></div>
      <button class="button4 dark-green" onclick="showDetailView('${event.id}')">Læs mere & tilmeld</button>
    </article>
    `;
    }

    document.querySelector("#content").innerHTML = htmlTemplate;
  }

  showDetailView(id) {
    const event = this.events.find((event) => event.id == id);
    document.querySelector("#calender-modal").style.display = "block";
    let htmlTemplate = "";
    htmlTemplate = /*html*/ `
    <div class="flex2">
    <span
      onclick="document.getElementById('calender-modal').style.display='none'"
      >&times;</span
    >
  </div>
    <div class="modal-content">
    <h3>${event.name}</h3>
    <div class="line5"></div>
    <p class="modal-text-p">${event.description}</p>
    <a href="${event.link}" target="_blank"><button class="button4 light-green">Tilmeld</button></a>
    </div>`;
    document.querySelector(".modal-text2").innerHTML = htmlTemplate;
  }

  //filter
  filterEvents() {
    document.addEventListener("change", () => {
      const checkedValues = [...document.querySelectorAll(".eventCheckBox")]
        .filter((input) => input.checked)
        .map((input) => input.value);
      const result = this.events.filter((item) => {
        if (item.category.some((tag) => tag == checkedValues)) {
          return item;
        }
      });
      this.appendEvents(result);
      if (checkedValues.length < 1) {
        this.appendEvents(this.events);
      }
    });
  }

  // search
  search(searchValue) {
    searchValue = searchValue.toLowerCase();
    console.log(searchValue);

    let results = [];

    for (const eventName of this.events) {
      console.log(eventName);
      let name = eventName.name.toLocaleLowerCase();
      if (name.includes(searchValue)) {
        results.push(eventName);
      }
    }

    this.appendEvents(results);
  }
  createEvent() {
    let selected = [];
    // references to the input fields
    let eventDateInput = document.querySelector("#eventDate");
    let eventNameInput = document.querySelector("#eventName");
    let eventUrlInput = document.querySelector("#eventURL");
    let eventDescriptionInput = document.querySelector("#eventDescription");
    for (const option of document.getElementById("eventCategories").options) {
      if (option.selected) {
        selected.push(option.value);
      }
    }

    const newEvent = {
      category: selected,
      date: eventDateInput.value,
      description: eventDescriptionInput.value,
      link: eventUrlInput.value,
      name: eventNameInput.value,
    };
    console.log(newEvent);
    addDoc(this.eventRef, newEvent);
  }

  updateEvent() {
    let selected = [];

    for (const option of document.getElementById("eventCategories-update")
      .options) {
      if (option.selected) {
        selected.push(option.value);
      }
    }
    const eventToUpdate = {
      name: document.querySelector("#eventName-update").value,
      date: document.querySelector("#eventDate-update").value,
      link: document.querySelector("#eventURL-update").value,
      description: document.querySelector("#eventDescription-update").value,
      category: selected,
    };
    const eventRef = doc(this.eventRef, _selectedEventId);
    updateDoc(eventRef, eventToUpdate);
  }

  selectEvent(id) {
    _selectedEventId = id;
    const event = this.events.find((event) => event.id == _selectedEventId);
    // references to the input fields
    document.querySelector("#eventDate-update").value = event.date;
    document.querySelector("#eventName-update").value = event.name;
    document.querySelector("#eventDescription-update").value =
      event.description;
    document.querySelector("#eventURL-update").value = event.link;
    document
      .querySelector("#calenderForm-update")
      .scrollIntoView({ behavior: "smooth" });
  }

  deleteEvent(id) {
    const docRef = doc(this.eventRef, id);
    deleteDoc(docRef);
  }
}

export let append_edit_calender = (events) => {
  let htmlTemplate = "";
  for (const event of events) {
    htmlTemplate += /*html*/ `
  <article>
    <p>${event.date}</p>
    <div class="whitespace"></div>
    <p>${event.name}</p>
    <div class="whitespace"></div>
    
    <button class="btn-delete-event button4 dark-green" type="button" onclick="deleteEvent('${event.id}')">Slet event</button>
    <button class="btn-update-event button4 dark-green" type="button" onclick="selectEvent('${event.id}')">Opdatér event</button>
    </article>
  `;
  }
  if (document.querySelector("#calender_edit")) {
    document.querySelector("#calender_edit").innerHTML = htmlTemplate;
  }
};
