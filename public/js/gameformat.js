//formats the game window nicely
$(document).ready(function () {
  var MARGIN = 50;
  var STATUS_BAR = 60;
  var LEFT_BAR = 60;
  var RIGHT_BAR = 60;
  var MIN_WIDTH = 600;
  var CONSOLE = 200;
  var WIDTH_MULTIPLIER = 1.61803398875; //how much wider the world should be than tall
  
  var $status = $('#status');
  var $box = $('#box');
  var $left = $('#left');
  var $right = $('#right');
  var $world = $('#world');
  var $console = $('#console');
  
  $status.css('min-width', MIN_WIDTH + 'px');
  $box.css('min-width', MIN_WIDTH + 'px');
  $console.css('min-width', MIN_WIDTH + 'px');
  $world.css('min-width', (MIN_WIDTH - RIGHT_BAR - LEFT_BAR - 2) + 'px');
  $status.css('height', STATUS_BAR + 'px');
  $console.css('height', CONSOLE + 'px');
  $left.css('width', LEFT_BAR + 'px');
  $right.css('width', RIGHT_BAR + 'px');
  $('#leftStatus').css('height', (STATUS_BAR) + 'px');
  $('#rightStatus').css('height', (STATUS_BAR) + 'px');
  $('#messages').css('height', (CONSOLE - $('#send').height() - 9) + 'px');
  
  
  var format = function() {
    var height = $(window).height();
    var width = $(window).width();
    
    var worldHeight = height - (2*MARGIN + $status.height() + $console.height());
    var worldWidth = worldHeight * WIDTH_MULTIPLIER;
    var boxWidth = worldWidth + LEFT_BAR + RIGHT_BAR;
    $box.css('height', worldHeight + 'px');
    $box.css('width', boxWidth + 'px');
    $world.css('width', (worldWidth - 2) + 'px');
    $world.css('height', (worldHeight - 2) + 'px');
    
    $status.css('width', boxWidth + 'px');
    $console.css('width', boxWidth + 'px');
    
    $('#leftStatus').css('width', ((boxWidth - 170) / 2 - 14) + 'px');
    $('#middleStatus').css('width', 170 + 'px');
    $('#rightStatus').css('width', ((boxWidth - 170) / 2 - 14) + 'px');
    
    $('#field').css('width', (boxWidth - $('#send').width() - 19) + 'px');
  }
  
  format();
  
  $(window).resize(format);
});