 <!-- -->
    <link rel="stylesheet" href="style.css" type="text/css" media="screen">
<script>
$(function ($) {
$.fn.fixedMenu = function () {
return this.each(function () {
var menu = $(this);
$("html").click(function() {
menu.find('.active').removeClass('active');
});
menu.find('ul li > a').bind('click', function (event) {
event.stopPropagation();
//check whether the particular link has a dropdown
if (!$(this).parent().hasClass('single-link') && !$(this).parent().hasClass('current')) {
//hiding drop down menu when it is clicked again
if ($(this).parent().hasClass('active')) {
$(this).parent().removeClass('active');
}
else {
//displaying the drop down menu
$(this).parent().parent().find('.active').removeClass('active');
$(this).parent().addClass('active');
}
}
else {
//hiding the drop down menu when some other link is clicked
$(this).parent().parent().find('.active').removeClass('active');
}
})
});
}
})(jQuery);
</script><script>
$('document').ready(function(){
$('.menu').fixedMenu();
});
</script>
<body>
<div class="menu">
<ul>
<li class="single-link"><!-- Using class="single-link" for links with no dropdown --> <a href="be06.php">Civil</a>
</li>
<li class="single-link"><!-- Using class="single-link" for links with no dropdown --> <a href="be02.php">Automobile</a>
</li>
<li class="single-link"><!-- Using class="single-link" for links with no dropdown --> <a href="be05.php">Chemical</a>
</li>
<li class="single-link"><!-- Using class="single-link" for links with no dropdown --> <a href="be07.php">Computer</a>
</li>
<li class="single-link"><!-- Using class="single-link" for links with no dropdown --> <a href="be11.php">EC</a>
</li>
<li class="single-link"><!-- Using class="single-link" for links with no dropdown --> <a href="be16.php">IT</a>
</li>
<li class="single-link"><!-- Using class="single-link" for links with no dropdown --> <a href="be19.php">Mechanical</a>
</li>
<li><!-- Do not add any class for links with dropdown --> <a href="#">More<span class="arrow"></span></a>
<!-- Drop Down menu Items --><ul>
<li><a href="http://www.google.co.in/reader">Reader</a></li>
<li><a href="https://sites.google.com">Sites</a></li>
<li><a href="http://groups.google.co.in">Groups</a></li>
<li><a href="http://www.youtube.com">YouTube</a></li>
<li>
<div class="mid-line">
</div>
</li>
<li><a href="#6">Civil</a></li>
<li><a href="#9">Electrical</a></li>
<li><a href="#7">Computer</a></li>
<li><a href="#%">Chemical</a></li>
<li><a href="#3">Bio Medical</a></li>
<li><a href="#2">Auto</a></li>
<li>
<div class="mid-line">
</div>
</li>
<li><a href="#1">even more >></a></li>
<li>Dhruv</li>
<li>Siddharth</li>
<div class="mid-line">
</div>
</li>
</ul>
</li>
</ul>
</div>
    <!-- -->