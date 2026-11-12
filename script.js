$(function () {
    "use strict";

    const $window = $(window);
    const $document = $(document);
    const $body = $("body");
    const $contenedor = $(".pwa-container");

    const esAcordeon = function () {
        return window.matchMedia("(max-width: 767px), (max-height: 880px)").matches;
    };

    const $themeToggle = $("#themeToggle");

    function aplicarTema(oscuro) {
        $body.toggleClass("dark-mode", oscuro);
        $themeToggle.text(oscuro ? "☀" : "☾");
        $('meta[name="theme-color"]').attr("content", oscuro ? "#0b1422" : "#101e36");
    }

    function alternarTema() {
        const oscuro = !$body.hasClass("dark-mode");
        aplicarTema(oscuro);

        try {
            localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
        } catch (error) {  }
    }

    try {
        aplicarTema(localStorage.getItem("tema") === "oscuro");
    } catch (error) {
        aplicarTema(false);
    }

    const $hamburgerBtn = $("#hamburgerBtn");
    const $navMenu = $("#navMenu");

    function marcarBoton(abierto) {
        $hamburgerBtn
            .toggleClass("open", abierto)
            .attr({
                "aria-expanded": String(abierto),
                "aria-label": abierto ? "Cerrar menú" : "Abrir menú"
            });
    }

    function cerrarMenu() {
        if ($navMenu.is(":visible")) {
            $navMenu.stop(true, true).slideUp(200);
        }
        marcarBoton(false);
    }

    function alternarMenu(e) {
        e.stopPropagation();
        const abrir = !$navMenu.is(":visible");
        $navMenu.stop(true, true).slideToggle(300);
        marcarBoton(abrir);
    }

    $document.off("click.menuDoc").on("click.menuDoc", function (e) {
        if ($navMenu.is(":visible") && !$(e.target).closest("#navMenu, #hamburgerBtn").length) {
            cerrarMenu();
        }
    });

    $document.off("keydown.menuEsc").on("keydown.menuEsc", function (e) {
        if (e.key === "Escape") cerrarMenu();
    });

    const $vistas = $(".view");
    const idsVistas = $vistas.map(function () { return this.id; }).get();

    function mostrarVista(id, guardarHistorial) {
        if (idsVistas.indexOf(id) === -1) id = "inicio";

        $vistas.removeClass("active");
        $("#" + id).addClass("active").scrollTop(0);

        $(".menu-link, .hud-nav-item, .hud-btn")
            .removeClass("active")
            .removeAttr("aria-current")
            .filter('[data-view="' + id + '"]')
            .addClass("active")
            .attr("aria-current", "page");

        cerrarMenu();

        if (id === "fotos") {
            iniciarCarrusel();
        } else {
            detenerCarrusel();
        }

        if (guardarHistorial && location.hash !== "#" + id) {
            try {
                history.pushState({ vista: id }, "", "#" + id);
            } catch (error) {
                location.hash = id;
            }
        }
    }

    function irAVista(e) {
        const destino = $(this).data("view") || (this.getAttribute("href") || "").slice(1);

        if (idsVistas.indexOf(destino) !== -1) {
            e.preventDefault();
            mostrarVista(destino, true);
        }
    }

    $window.off("popstate.vistas hashchange.vistas").on("popstate.vistas hashchange.vistas", function () {
        mostrarVista(location.hash.slice(1), false);
    });

    const $carousel = $("#photoCarousel");
    const $track = $("#carouselTrack");
    const $dotsContainer = $("#carouselDots");
    const $slides = $(".carousel-slide");
    let slideActual = 0;
    let intervalo = null;
    let inicioX = 0;
    let arrastrando = false;

    $dotsContainer.empty();
    $slides.each(function (index) {
        $("<button>", {
            type: "button",
            class: "carousel-dot" + (index === 0 ? " active" : ""),
            "aria-label": "Ver imagen " + (index + 1),
            "data-hidratado": "false"
        }).appendTo($dotsContainer);
    });

    const $dots = $dotsContainer.find(".carousel-dot");

    function mostrarSlide(index) {
        if (index < 0) {
            slideActual = $slides.length - 1;
        } else if (index >= $slides.length) {
            slideActual = 0;
        } else {
            slideActual = index;
        }

        $track.css("transform", "translateX(-" + slideActual * 100 + "%)");
        $dots.each(function (i) {
            $(this).toggleClass("active", i === slideActual);
        });
    }

    function detenerCarrusel() {
        clearInterval(intervalo);
        intervalo = null;
    }

    function iniciarCarrusel() {
        detenerCarrusel();
        if ($slides.length > 1) {
            intervalo = setInterval(function () {
                mostrarSlide(slideActual + 1);
            }, 4000);
        }
    }

    function reiniciarCarrusel() {
        if ($("#fotos").hasClass("active")) iniciarCarrusel();
    }

    function alternarTarjetaInfo() {
        if (!esAcordeon()) return;

        const $tarjeta = $(this).closest(".info-card");
        const abrir = !$tarjeta.hasClass("open");

        $(".info-card").removeClass("open").find(".info-head").attr("aria-expanded", "false");

        if (abrir) {
            $tarjeta.addClass("open");
            $(this).attr("aria-expanded", "true");
        }
    }

    function cambiarPestana() {
        const tab = $(this).data("tab");

        $(".sub-tab").removeClass("active").attr("aria-selected", "false");
        $(this).addClass("active").attr("aria-selected", "true");

        $(".sub-panel").removeClass("active");
        $("#tab-" + tab).addClass("active");
    }

    const $songSearch = $("#songSearch");
    const $songFilter = $("#songFilter");
    const $songRows = $("#songTableBody tr");
    const $noSongsMessage = $("#noSongsMessage");

    function filtrarCanciones() {
        const texto = $.trim($songSearch.val()).toLowerCase();
        const generoElegido = $songFilter.val();
        let visibles = 0;

        $songRows.each(function () {
            const $fila = $(this);
            const coincideTexto = $fila.text().toLowerCase().indexOf(texto) !== -1;
            const coincideGenero = generoElegido === "todos" || $fila.data("genre") === generoElegido;
            const mostrar = coincideTexto && coincideGenero;

            $fila.toggle(mostrar);
            if (mostrar) visibles++;
        });

        $noSongsMessage.prop("hidden", visibles !== 0);
    }

    const $filtrosJuegos = $(".filter-btn");
    const $juegos = $(".game-item");

    function filtrarJuegos() {
        const categoria = $(this).data("filter");

        $filtrosJuegos.removeClass("active");
        $(this).addClass("active");

        $juegos.each(function () {
            const mostrar = categoria === "todos" || $(this).data("category") === categoria;
            $(this).toggle(mostrar);
        });

        $(".game-card")
            .removeClass("open")
            .attr({ "aria-pressed": "false", "aria-expanded": "false" })
            .find("p")
            .stop(true, true)
            .hide();
    }

    function alternarTarjetaJuego() {
        const $tarjeta = $(this);
        const abrir = !$tarjeta.hasClass("open");

        $tarjeta
            .toggleClass("open", abrir)
            .attr({ "aria-pressed": String(abrir), "aria-expanded": String(abrir) })
            .find("p")
            .stop(true, true)
            .slideToggle(220);
    }

    function activarConTeclado(e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            $(this).trigger("click");
        }
    }

    const $form = $("#pwaForm");
    const $nombre = $("#nombre");
    const $correo = $("#correo");
    const $asunto = $("#asunto");
    const $mensaje = $("#mensaje");

    const $errorNombre = $("#errorNombre");
    const $errorCorreo = $("#errorCorreo");
    const $errorAsunto = $("#errorAsunto");
    const $errorMensaje = $("#errorMensaje");

    const $alerta = $("#alertaBox");
    const $exito = $("#successAlert");

    function mensajeCampo($error, texto) {
        if (texto) {
            $error.stop(true, true).text(texto).fadeIn(200);
        } else {
            $error.stop(true, true).fadeOut(150, function () {
                $(this).text("");
            });
        }
    }

    function mostrarEstado($campo, valido) {
        $campo.removeClass("valid-field invalid-field").addClass(valido ? "valid-field" : "invalid-field");
    }

    function validarNombre() {
        const valor = $.trim($nombre.val());
        const partes = valor.split(/\s+/);
        const nombreValido = /^[\p{L}\s'-]+$/u.test(valor);

        if (valor === "") {
            mensajeCampo($errorNombre, "El nombre es obligatorio.");
            mostrarEstado($nombre, false);
            return false;
        }

        if (!nombreValido) {
            mensajeCampo($errorNombre, "El nombre solo debe contener letras.");
            mostrarEstado($nombre, false);
            return false;
        }

        if (partes.length < 2) {
            mensajeCampo($errorNombre, "Falta escribir al menos un apellido.");
            mostrarEstado($nombre, false);
            return false;
        }

        if (partes.some(function (parte) { return parte.length < 2; })) {
            mensajeCampo($errorNombre, "Escribe correctamente tu nombre y apellido.");
            mostrarEstado($nombre, false);
            return false;
        }

        mensajeCampo($errorNombre, "");
        mostrarEstado($nombre, true);
        return true;
    }

    function validarCorreo() {
        const valor = $.trim($correo.val());
        const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (valor === "") {
            mensajeCampo($errorCorreo, "El correo electrónico es obligatorio.");
            mostrarEstado($correo, false);
            return false;
        }

        if (!expresionCorreo.test(valor)) {
            mensajeCampo($errorCorreo, "Ingresa un correo electrónico válido.");
            mostrarEstado($correo, false);
            return false;
        }

        mensajeCampo($errorCorreo, "");
        mostrarEstado($correo, true);
        return true;
    }

    function validarAsunto() {
        const valor = $.trim($asunto.val());

        if (valor === "") {
            mensajeCampo($errorAsunto, "El asunto es obligatorio.");
            mostrarEstado($asunto, false);
            return false;
        }

        if (valor.length < 3) {
            mensajeCampo($errorAsunto, "El asunto debe tener al menos 3 caracteres.");
            mostrarEstado($asunto, false);
            return false;
        }

        mensajeCampo($errorAsunto, "");
        mostrarEstado($asunto, true);
        return true;
    }

    function validarMensaje() {
        const valor = $.trim($mensaje.val());

        if (valor === "") {
            mensajeCampo($errorMensaje, "El mensaje es obligatorio.");
            mostrarEstado($mensaje, false);
            return false;
        }

        if (valor.length < 10) {
            mensajeCampo($errorMensaje, "El mensaje debe tener al menos 10 caracteres.");
            mostrarEstado($mensaje, false);
            return false;
        }

        mensajeCampo($errorMensaje, "");
        mostrarEstado($mensaje, true);
        return true;
    }

    function mostrarAlerta(texto, tipo) {
        if (tipo === "success") {

            $alerta.text("").attr("class", "");
            $exito.stop(true, true).text(texto).slideDown().delay(3000).slideUp();
        } else {
            $exito.stop(true, true).hide();
            $alerta.text(texto).attr("class", "alert alert-" + tipo + " mt-3");
        }
    }

    function comprobarAnterior($campoActual) {
        let campoInvalido = null;

        if ($campoActual.is($correo) && !validarNombre()) {
            campoInvalido = $nombre;
        }

        if ($campoActual.is($asunto)) {
            if (!validarNombre()) {
                campoInvalido = $nombre;
            } else if (!validarCorreo()) {
                campoInvalido = $correo;
            }
        }

        if ($campoActual.is($mensaje)) {
            if (!validarNombre()) {
                campoInvalido = $nombre;
            } else if (!validarCorreo()) {
                campoInvalido = $correo;
            } else if (!validarAsunto()) {
                campoInvalido = $asunto;
            }
        }

        if (campoInvalido) {
            mostrarAlerta("Debes completar correctamente los campos anteriores.", "warning");
            setTimeout(function () { campoInvalido.trigger("focus"); }, 0);
            return false;
        }

        $alerta.text("").attr("class", "");
        return true;
    }

    const CLAVE_COLA = "mensajesPendientes";

    function leerCola() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_COLA)) || [];
        } catch (error) {
            return [];
        }
    }

    function escribirCola(cola) {
        try {
            localStorage.setItem(CLAVE_COLA, JSON.stringify(cola));
        } catch (error) {
            return;
        }
    }

    function guardarPendiente(mensaje) {
        const cola = leerCola();
        cola.push(mensaje);
        escribirCola(cola);
    }

    function enviarFormulario(e) {
        e.preventDefault();

        const nombreValido = validarNombre();
        const correoValido = validarCorreo();
        const asuntoValido = validarAsunto();
        const mensajeValido = validarMensaje();

        if (nombreValido && correoValido && asuntoValido && mensajeValido) {
            if (navigator.onLine) {
                mostrarAlerta("¡Formulario validado correctamente!", "success");
            } else {
                guardarPendiente({
                    nombre: $.trim($nombre.val()),
                    correo: $.trim($correo.val()),
                    asunto: $.trim($asunto.val()),
                    mensaje: $.trim($mensaje.val()),
                    fecha: new Date().toISOString()
                });
                mostrarAlerta("💾 Guardado localmente - Pendiente de envío", "success");
            }

            $form[0].reset();

            $nombre.add($correo).add($asunto).add($mensaje).removeClass("valid-field invalid-field");
            $errorNombre.add($errorCorreo).add($errorAsunto).add($errorMensaje).stop(true, true).hide().text("");
        } else {
            mostrarAlerta("Completa correctamente todos los campos antes de continuar.", "danger");

            if (!nombreValido) {
                $nombre.trigger("focus");
            } else if (!correoValido) {
                $correo.trigger("focus");
            } else if (!asuntoValido) {
                $asunto.trigger("focus");
            } else {
                $mensaje.trigger("focus");
            }
        }
    }

    const $estadoRed = $("#estadoRed");
    const $avisoRed = $("#avisoRed");
    let temporizadorAviso = null;

    function mostrarAviso(texto) {
        clearTimeout(temporizadorAviso);
        $avisoRed.text(texto).stop(true, true).fadeIn(200);
        temporizadorAviso = setTimeout(function () {
            $avisoRed.fadeOut(300);
        }, 3800);
    }

    function actualizarEstadoRed() {
        const enLinea = navigator.onLine;

        $estadoRed
            .toggleClass("offline", !enLinea)
            .text(enLinea ? "🟢 En línea" : "🟠 Sin conexión")
            .attr("title", enLinea ? "En Línea" : "Modo Offline Activo (Datos Locales)");
    }

    function sincronizarPendientes() {
        const cola = leerCola();

        if (!cola.length || !navigator.onLine) return;

        escribirCola([]);
        mostrarAviso("✅ " + cola.length + (cola.length === 1 ? " mensaje verificado" : " mensajes verificados") + " al recuperar la red");
    }

    function cambioDeRed() {
        actualizarEstadoRed();

        if (navigator.onLine) {
            mostrarAviso("🟢 En Línea");
            sincronizarPendientes();
        } else {
            mostrarAviso("🟠 Modo Offline Activo (Datos Locales)");
        }
    }

    $window.off("online.red offline.red").on("online.red offline.red", cambioDeRed);

    const componentes = [
        {
            nombre: "Menú hamburguesa",
            selector: "#hamburgerBtn",
            conectar: function ($el) { $el.off("click.hidratar").on("click.hidratar", alternarMenu); }
        },
        {
            nombre: "Botón de tema",
            selector: "#themeToggle",
            conectar: function ($el) { $el.off("click.hidratar").on("click.hidratar", alternarTema); }
        },
        {
            nombre: "Enlaces y botones de navegación",
            selector: ".nav-brand, .menu-link, .btn-main[href^='#'], .btn-ghost[href^='#'], .hud-btn, .hud-nav-item",
            conectar: function ($el) { $el.off("click.hidratar").on("click.hidratar", irAVista); }
        },
        {
            nombre: "Carrusel (deslizar con el dedo o el mouse)",
            selector: "#photoCarousel",
            conectar: function ($el) {
                $el.off("pointerdown.hidratar pointerup.hidratar pointercancel.hidratar pointerleave.hidratar")
                    .on("pointerdown.hidratar", function (e) {
                        if ($(e.target).closest("button").length) return;
                        inicioX = e.originalEvent.clientX;
                        arrastrando = true;
                        $el.addClass("dragging");
                    })
                    .on("pointerup.hidratar", function (e) {
                        if (!arrastrando) return;

                        const diferencia = e.originalEvent.clientX - inicioX;

                        if (diferencia > 50) {
                            mostrarSlide(slideActual - 1);
                            reiniciarCarrusel();
                        } else if (diferencia < -50) {
                            mostrarSlide(slideActual + 1);
                            reiniciarCarrusel();
                        }

                        arrastrando = false;
                        $el.removeClass("dragging");
                    })
                    .on("pointercancel.hidratar pointerleave.hidratar", function () {
                        arrastrando = false;
                        $el.removeClass("dragging");
                    });
            }
        },
        {
            nombre: "Flechas del carrusel",
            selector: ".carousel-arrow",
            conectar: function ($el) {
                $el.off("click.hidratar").on("click.hidratar", function () {
                    mostrarSlide(slideActual + ($(this).hasClass("next") ? 1 : -1));
                    reiniciarCarrusel();
                });
            }
        },
        {
            nombre: "Puntos del carrusel",
            selector: ".carousel-dot",
            conectar: function ($el) {
                $el.off("click.hidratar").on("click.hidratar", function () {
                    mostrarSlide($(this).index());
                    reiniciarCarrusel();
                });
            }
        },
        {
            nombre: "Tarjetas de información",
            selector: ".info-head",
            conectar: function ($el) { $el.off("click.hidratar").on("click.hidratar", alternarTarjetaInfo); }
        },
        {
            nombre: "Pestañas de música",
            selector: ".sub-tab",
            conectar: function ($el) { $el.off("click.hidratar").on("click.hidratar", cambiarPestana); }
        },
        {
            nombre: "Buscador de canciones",
            selector: "#songSearch",
            conectar: function ($el) { $el.off("input.hidratar").on("input.hidratar", filtrarCanciones); }
        },
        {
            nombre: "Filtro de género",
            selector: "#songFilter",
            conectar: function ($el) { $el.off("change.hidratar").on("change.hidratar", filtrarCanciones); }
        },
        {
            nombre: "Filtros de videojuegos",
            selector: ".filter-btn",
            conectar: function ($el) { $el.off("click.hidratar").on("click.hidratar", filtrarJuegos); }
        },
        {
            nombre: "Tarjetas de videojuegos",
            selector: ".game-card",
            conectar: function ($el) {
                $el.off("click.hidratar keydown.hidratar")
                    .on("click.hidratar", alternarTarjetaJuego)
                    .on("keydown.hidratar", activarConTeclado);
            }
        },
        {
            nombre: "Formulario de contacto",
            selector: "#pwaForm",
            conectar: function ($el) {
                $el.off("submit.hidratar").on("submit.hidratar", enviarFormulario);

                $correo.off("focus.hidratar").on("focus.hidratar", function () { comprobarAnterior($correo); });
                $asunto.off("focus.hidratar").on("focus.hidratar", function () { comprobarAnterior($asunto); });
                $mensaje.off("focus.hidratar").on("focus.hidratar", function () { comprobarAnterior($mensaje); });

                $nombre.off("blur.hidratar input.hidratar").on("blur.hidratar input.hidratar", validarNombre);
                $correo.off("blur.hidratar input.hidratar").on("blur.hidratar input.hidratar", validarCorreo);
                $asunto.off("blur.hidratar input.hidratar").on("blur.hidratar input.hidratar", validarAsunto);
                $mensaje.off("blur.hidratar input.hidratar").on("blur.hidratar input.hidratar", validarMensaje);
            }
        }
    ];

    function hidratarInterfaz() {
        $.each(componentes, function (i, componente) {
            $(componente.selector).each(function () {
                const $el = $(this);

                if ($el.attr("data-hidratado") === "true") return;

                componente.conectar($el);
                $el.attr("data-hidratado", "true");
            });
        });

        $('[data-hidratado="false"]').attr("data-hidratado", "true");

        $contenedor.attr("aria-busy", "false");
        console.log("Interfaz hidratada: " + $('[data-hidratado="true"]').length + " elementos listos.");
    }

    mostrarVista(location.hash.slice(1), false);
    actualizarEstadoRed();
    sincronizarPendientes();
    setTimeout(hidratarInterfaz, 500);
});
