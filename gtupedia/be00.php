<?php
$con = mysql_connect("mysql1000.mochahost.com","chirag99_dhruv","sidsai24");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

$dbs=mysql_select_db('chirag99_dhruv',$con);
?>
<!DOCTYPE html>
<html lang="en" class="no-js">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"> 
		<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
		<title>Engineering</title>
		<meta name="description" content="" />
		<meta name="keywords" content="" />
		<meta name="author" content="Codrops" />
		<link rel="shortcut icon" href="../favicon.ico">
		<link rel="stylesheet" type="text/css" href="css/normalize.css" />
		<link rel="stylesheet" type="text/css" href="css/demo.css" />
		<link rel="stylesheet" type="text/css" href="css/component.css" />
		<script src="js/modernizr.custom.js"></script>
	</head>
	<body>
		<div class="container">
			<!-- Top Navigation -->
			<div class="codrops-top clearfix">
				<a class="codrops-icon codrops-icon-prev" href="http://www.gtupedia.com/"><span>Home</span></a>
				<span class="right"><a class="codrops-icon codrops-icon-drop" href="http://www.facebook.com/gtupedia.com"><span>FB Page</span></a></span>
			</div>
			<header>
				<h1>Engineering<span>Select Your Subject</span></h1>
				<p>Click on the Branch and get all material related to it  :)</p>
			</header>
			<section class="color-1">
				<nav class="cl-effect-14">
					<?php $result = mysql_query("SELECT * FROM branch ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='branch.php?br_code=";
  echo $row['br_code'];
  echo "'>";
  echo $row['br_name'];
  echo "</a>";
  }


?>
				</nav>
			</section>
		</div><!-- /container -->
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
	</body>
</html>