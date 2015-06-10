(function ($) {
    "use strict";

    $(document).ready(function ($) {

        var contactUsForm = $('#contact-us-form'),
            formSentFeedback = $("#form-sent-feedback"),
            contactUsFormPanel = $(".contact-us-form-panel");

        contactUsForm.on('valid.fndtn.abide', function () {

            var formData;

            formData = {
                "Name": $("input[name='contactName']", contactUsForm).val(),
                "Email": $("input[name='contactEmail']", contactUsForm).val(),
                "Number": $("input[name='contactNumber']", contactUsForm).val(),
                "Message": $("textarea[name='contactMessage']", contactUsForm).val()
            };

            $.ajax({
                url: "//formspree.io/sonal@padmakosh.com",
                method: "POST",
                data: formData,
                dataType: "json"
            })
            .then(function () {
                contactUsFormPanel
                    .addClass("animated zoomOutRight")
                    .one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function () {
                        contactUsFormPanel.remove();
                        formSentFeedback.css("display", "inline-block").addClass("animated fadeIn");
                    });
            });

        });

        contactUsForm.on("invalid.fndtn.abide", function () {
            contactUsFormPanel
                .removeClass("animated shake")
                .addClass("animated shake")
                .one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function () {
                    contactUsFormPanel.removeClass("animated shake");
                });
        });

    });

})(jQuery);