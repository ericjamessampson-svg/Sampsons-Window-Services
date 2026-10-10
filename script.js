// Quote form: builds a text message and opens the visitor's texting app
// addressed to the business number. No server needed.
(function () {
  var PHONE = "+15129473460";

  var form = document.getElementById("quote");
  var errorEl = document.getElementById("form-error");
  var fallback = document.getElementById("fallback");
  var fallbackMsg = document.getElementById("fallback-msg");
  var copyBtn = document.getElementById("copy-msg");

  document.getElementById("year").textContent = new Date().getFullYear();

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  function buildMessage(data) {
    var services = data.getAll("service");
    var lines = [
      "Hi Sampson's! I'd like a free quote.",
      "Name: " + data.get("name").trim(),
      "Phone: " + data.get("phone").trim()
    ];
    var email = data.get("email").trim();
    if (email) lines.push("Email: " + email);
    var address = data.get("address").trim();
    if (address) lines.push("Address: " + address);
    lines.push("Property: " + data.get("property"));
    lines.push("How often: " + data.get("frequency"));
    if (services.length) lines.push("Services: " + services.join(", "));
    var notes = data.get("notes").trim();
    if (notes) lines.push("Notes: " + notes);
    return lines.join("\n");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = form.elements.name;
    var phone = form.elements.phone;
    var missing = [];

    [name, phone].forEach(function (input) {
      var empty = !input.value.trim();
      input.setAttribute("aria-invalid", empty ? "true" : "false");
      if (empty) missing.push(input);
    });

    if (missing.length) {
      errorEl.textContent = "Add your name and phone number so we can send your quote.";
      errorEl.hidden = false;
      missing[0].focus();
      return;
    }
    errorEl.hidden = true;

    var message = buildMessage(new FormData(form));
    fallbackMsg.value = message;
    fallback.hidden = false;

    // "?&body=" is understood by both iOS and Android messaging apps.
    window.location.href = "sms:" + PHONE + "?&body=" + encodeURIComponent(message);
  });

  copyBtn.addEventListener("click", function () {
    fallbackMsg.select();
    var done = function () { copyBtn.textContent = "Copied"; };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fallbackMsg.value).then(done, function () {
        document.execCommand("copy");
        done();
      });
    } else {
      document.execCommand("copy");
      done();
    }
  });
})();
