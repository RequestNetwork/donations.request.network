(function($) {
  "use strict"; // Start of use strict

  // Smooth scrolling using jQuery easing
  $(document).ready(function() {
    const elements = $('a.js-scroll-trigger[href*="#"]:not([href="#"])');
    console.log(elements);
    // elements.forEach(e =>
    //   console.log({
    //     pathname: location.pathname.replace(/^\//, ""),
    //     this_pathname: this.pathname.replace(/^\//, ""),
    //     hostname: location.hostname,
    //     this_hostname: this.hostname,
    //     this_hash: this.hash
    //   })
    // );
    elements.click(function() {
      if (
        location.pathname.replace(/^\//, "") ==
          this.pathname.replace(/^\//, "") &&
        location.hostname == this.hostname
      ) {
        var target = $(this.hash);
        target = target.length
          ? target
          : $("[name=" + this.hash.slice(1) + "]");
        if (target.length) {
          $("html, body").animate(
            {
              scrollTop: target.offset().top - 48
            },
            1000,
            "easeInOutExpo"
          );
          return false;
        }
      }
    });

    // Closes responsive menu when a scroll trigger link is clicked
    $(".js-scroll-trigger").click(function() {
      $(".navbar-collapse").collapse("hide");
    });

    // Activate scrollspy to add active class to navbar items on scroll
    $("body").scrollspy({
      target: "#mainNav",
      offset: 54
    });

    // Collapse Navbar
    var navbarCollapse = function() {
      console.log("scrolled");
      const offset = $("#mainNav").offset();
      if (offset && offset.top > 100) {
        $("#mainNav").addClass("navbar-shrink");
      } else {
        $("#mainNav").removeClass("navbar-shrink");
      }
    };
    // Collapse now if page is not at top
    navbarCollapse();
    // Collapse the navbar when page is scrolled
    $(window).scroll(navbarCollapse);
  });
})(jQuery); // End of use strict
