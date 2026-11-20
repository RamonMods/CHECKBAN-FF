(function () {
  "use strict";

  var API = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://127.0.0.1:5000"
    : "https://ramonmods-api.onrender.com";

  var form = document.getElementById("form");
  var input = document.getElementById("uid");
  var button = document.getElementById("submit");
  var label = document.getElementById("submit-label");
  var hint = document.getElementById("hint");
  var result = document.getElementById("result");
  var errorBox = document.getElementById("error");
  var errorTitle = document.getElementById("error-title");
  var errorText = document.getElementById("error-text");

  var t = {
    nick: document.getElementById("r-nick"),
    uid: document.getElementById("r-uid"),
    region: document.getElementById("r-region"),
    period: document.getElementById("r-period"),
    time: document.getElementById("r-time"),
    dot: document.getElementById("status-dot"),
    kicker: document.getElementById("status-kicker"),
    title: document.getElementById("status-title"),
    badge: document.getElementById("status-badge"),
    note: document.getElementById("result-note")
  };

  var slowTimer = null;

  function setHint(msg, isError) {
    hint.textContent = msg;
    hint.classList.toggle("is-error", !!isError);
  }

  function reset() {
    result.hidden = true;
    errorBox.hidden = true;
    result.classList.remove("is-clean", "is-banned");
  }

  function showError(title, msg) {
    reset();
    errorTitle.textContent = title;
    errorText.textContent = msg;
    errorBox.hidden = false;
  }

  var PERIODS = { 1: "1 semana", 2: "1 mês", 3: "3 meses", 4: "6 meses", 5: "1 ano", 6: "permanente" };

  function periodLabel(d) {
    if (d.period_label) return d.period_label;
    return PERIODS[d.period] || "não informado";
  }

  function showResult(d) {
    reset();
    var banned = !!d.banned;

    result.classList.add(banned ? "is-banned" : "is-clean");
    t.kicker.textContent = banned ? "Resultado da consulta" : "Resultado da consulta";
    t.title.textContent = banned ? "Conta banida" : "Conta limpa";
    t.badge.textContent = banned ? "BANIDO" : "SEM BANIMENTO";
    t.nick.textContent = d.nickname || "indisponível";
    t.uid.textContent = d.uid || input.value.trim();
    t.region.textContent = d.region || "indisponível";
    t.period.textContent = banned ? periodLabel(d) : "—";
    t.time.textContent = (d.elapsed_ms || 0) + " ms";
    t.note.textContent = banned
      ? "Duração informada pela Garena no momento da consulta."
      : "Nenhum banimento ativo encontrado para este UID.";

    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var uid = input.value.trim();

    if (!/^\d{6,12}$/.test(uid)) {
      setHint("UID inválido: use de 6 a 12 dígitos.", true);
      input.focus();
      return;
    }

    setHint("Consultando…", false);
    button.disabled = true;
    label.textContent = "Consultando";
    reset();

    slowTimer = setTimeout(function () {
      setHint("Acordando o servidor (pode levar até 50s)…", false);
    }, 4000);

    fetch(API + "/checkban?uid=" + encodeURIComponent(uid), {
      headers: { "Accept": "application/json" }
    })
      .then(function (resp) {
        return resp.json().then(function (body) {
          return { ok: resp.ok, status: resp.status, body: body };
        });
      })
      .then(function (r) {
        if (!r.ok) {
          var msg = (r.body && r.body.error) || "Falha na consulta.";
          if (r.status === 404 && /não encontrado/i.test(msg)) {
            showError("UID não encontrado", "Confira o número. A Garena não reconhece esse UID.");
          } else if (r.status === 429) {
            showError("Muitas consultas", "Aguarde um minuto e tente de novo.");
          } else {
            showError("Não foi possível consultar", msg);
          }
          return;
        }
        showResult(r.body);
        setHint("Consulta concluída.", false);
      })
      .catch(function () {
        showError("Servidor indisponível", "Não foi possível falar com a API. Tente novamente em alguns segundos.");
        setHint("Falha de conexão.", true);
      })
      .finally(function () {
        clearTimeout(slowTimer);
        button.disabled = false;
        label.textContent = "Consultar";
      });
  });

  input.addEventListener("input", function () {
    input.value = input.value.replace(/\D/g, "").slice(0, 12);
    setHint("6 a 12 dígitos.", false);
  });
})();
