//formats the game window "nicely"
//                          ^
//ohhhh, burn ______________|    

$(document).ready(function () {
  
  var format = function() {
    var height = $(window).height();
    var width = $(window).width();
    
    var PADDING = parseInt($('body').css('margin'));
    var CONSOLE_HEIGHT = parseInt($('#console').outerHeight());
    var SIDEBAR_WIDTH = parseInt($('#sidebar').outerWidth());
    
    $('#world').height(height - 2*PADDING - CONSOLE_HEIGHT - 2);
    $('#world').width(width - 2*PADDING - SIDEBAR_WIDTH - 2);
    $('#sidebar').height(height - 3*PADDING - 2);
    
    $('#top').height($('#sidebar').height() - $('#bottom').height());
  }
  
  format();
  
  $(window).resize(format);
});