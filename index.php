<?php
$con = mysql_connect("mysql1000.mochahost.com","chirag99_dhruv","sidsai24");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

$dbs=mysql_select_db('chirag99_dhruv',$con);
?>
<!DOCTYPE  html>
<html>
	<head>
	<title>GTUPEDIA - " For Students By Students "</title>
		<meta charset="utf-8">
		<meta property="og:title" content="GTUPEDIA - For Students By Students" />
		<meta property="og:type" content="article" />
		<meta property="og:url" content="http://www.gtupedia.com/" />
		<meta property="og:image" content="http://gtupedia.com/image.jpg" />
		<meta property="og:description" content="Get Question Papers , Study Materials , Solutions , PPTS by one click download." />
		<meta name="keywords" content="gtu, gtupedia, exam, results, engineering"
        
 
		<link rel="shortcut icon" href="favicon.ico">
		<link rel="stylesheet" type="text/css" href="cssi/default.css" />
		<link rel="stylesheet" type="text/css" href="cssi/component.css" />
		<script src="jsi/modernizr.custom.js"></script>
<!--- Google analytics -->
        <script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-34081583-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
		<!--- Google analytics -->
	</head>
	<body class="cbp-spmenu-push">
		<nav class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left" id="cbp-spmenu-s1">
			<h3>Engineering</h3>
			<a href='branch.php?br_code=6'>Civil</a>
            <a href='branch.php?br_code=7'>Computer</a>
            <a href='branch.php?br_code=9'>Electrial</a>
            <a href='branch.php?br_code=11'>Electronics & Communication</a>
            <a href='branch.php?br_code=16'>Information & Technology</a>
            <a href='branch.php?br_code=19'>Mechanical</a>
            <a href='be00.php'>More</a>



		</nav>
		<nav class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right" id="cbp-spmenu-s2">
			<h3>Pharmacy</h3>
			<a href="#">Coming Soon</a>
        
		</nav>
		<nav class="cbp-spmenu cbp-spmenu-horizontal cbp-spmenu-top" id="cbp-spmenu-s3">
			<h3>MBA</h3>
			<a href="#">Coming Soon</a>
          
		
		</nav>
		<nav class="cbp-spmenu cbp-spmenu-horizontal cbp-spmenu-bottom" id="cbp-spmenu-s4">
			<h3>MCA</h3>
			<a href="#">Coming Soon</a>
       
		</nav>
		<div class="container">
			<header class="clearfix">
				<span>For Students By Students</span>
				<h1>GTUPEDIA</h1>
			</header>
			<div class="main">
				<section>
					<h2>Select Your Field</h2>
					<!-- Class "cbp-spmenu-open" gets applied to menu -->
					<button id="showLeft">Engineering</button>
					<button id="showRight">Pharmacy</button>
					<button id="showTop">MBA</button>
					<button id="showBottom">MCA</button>
				</section>
				<section class="buttonset">
					<h2>Our Help to you</h2>
					<!-- Class "cbp-spmenu-open" gets applied to menu and "cbp-spmenu-push-toleft" or "cbp-spmenu-push-toright" to the body -->
					<a href="http://blog.gtupedia.com"><button id="">BLOG</button></a>
					<a href="http://project.gtupedia.com"><button id="">PROJECT</button></a>
				</section>
			</div>
		</div>
		<!-- Classie - class helper functions by @desandro https://github.com/desandro/classie -->
		<script src="jsi/classie.js"></script>
		<script>
			var menuLeft = document.getElementById( 'cbp-spmenu-s1' ),
				menuRight = document.getElementById( 'cbp-spmenu-s2' ),
				menuTop = document.getElementById( 'cbp-spmenu-s3' ),
				menuBottom = document.getElementById( 'cbp-spmenu-s4' ),
				showLeft = document.getElementById( 'showLeft' ),
				showRight = document.getElementById( 'showRight' ),
				showTop = document.getElementById( 'showTop' ),
				showBottom = document.getElementById( 'showBottom' ),
				showLeftPush = document.getElementById( 'showLeftPush' ),
				showRightPush = document.getElementById( 'showRightPush' ),
				body = document.body;

			showLeft.onclick = function() {
				classie.toggle( this, 'active' );
				classie.toggle( menuLeft, 'cbp-spmenu-open' );
				disableOther( 'showLeft' );
			};
			showRight.onclick = function() {
				classie.toggle( this, 'active' );
				classie.toggle( menuRight, 'cbp-spmenu-open' );
				disableOther( 'showRight' );
			};
			showTop.onclick = function() {
				classie.toggle( this, 'active' );
				classie.toggle( menuTop, 'cbp-spmenu-open' );
				disableOther( 'showTop' );
			};
			showBottom.onclick = function() {
				classie.toggle( this, 'active' );
				classie.toggle( menuBottom, 'cbp-spmenu-open' );
				disableOther( 'showBottom' );
			};
			showLeftPush.onclick = function() {
				classie.toggle( this, 'active' );
				classie.toggle( body, 'cbp-spmenu-push-toright' );
				classie.toggle( menuLeft, 'cbp-spmenu-open' );
				disableOther( 'showLeftPush' );
			};
			showRightPush.onclick = function() {
				classie.toggle( this, 'active' );
				classie.toggle( body, 'cbp-spmenu-push-toleft' );
				classie.toggle( menuRight, 'cbp-spmenu-open' );
				disableOther( 'showRightPush' );
			};

			function disableOther( button ) {
				if( button !== 'showLeft' ) {
					classie.toggle( showLeft, 'disabled' );
				}
				if( button !== 'showRight' ) {
					classie.toggle( showRight, 'disabled' );
				}
				if( button !== 'showTop' ) {
					classie.toggle( showTop, 'disabled' );
				}
				if( button !== 'showBottom' ) {
					classie.toggle( showBottom, 'disabled' );
				}
				if( button !== 'showLeftPush' ) {
					classie.toggle( showLeftPush, 'disabled' );
				}
				if( button !== 'showRightPush' ) {
					classie.toggle( showRightPush, 'disabled' );
				}
			}
		</script>
	</body>
</html>
