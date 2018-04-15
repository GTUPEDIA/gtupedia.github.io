<?php
$con = mysql_connect("mysql1000.mochahost.com","chirag99_dhruv","sidsai24");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

$dbs=mysql_select_db('chirag99_dhruv',$con);
$br_code=$_GET['br_code'];
?>
<!DOCTYPE html>
<html lang="en" class="no-js">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"> 
		<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
		<title><?php $result = mysql_query("SELECT * FROM branch WHERE br_code=$br_code ");

while($row = mysql_fetch_array($result))
  {
  echo $row['br_name'];
  }


?></title>
		<meta name="description" content="" />
		<meta name="keywords" content="" />
		<meta name="author" content="Codrops" />
		<link rel="shortcut icon" href="../favicon.ico">
		<link rel="stylesheet" type="text/css" href="css/normalize.css" />
		<link rel="stylesheet" type="text/css" href="css/demo.css" />
		<link rel="stylesheet" type="text/css" href="css/component.css" />
		<script src="js/modernizr.custom.js"></script>
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
	<body>
		<div class="container">
			<!-- Top Navigation -->
			
			<header>
				<h1><?php $result = mysql_query("SELECT * FROM branch WHERE br_code=$br_code ");

while($row = mysql_fetch_array($result))
  {
  echo $row['br_name'];
  }


?><span>Select Your Subject</span></h1>
				<p>Click on the subject and get all material related to it  :)</p>
			</header>
            <section class="color-1"></section>
			<center><h2>SEMESTER 1 & 2</h2></center>
            <section class="color-1">
				<nav class="cl-effect-14">
                <?php $result = mysql_query("SELECT * FROM sublist WHERE br_code='0' AND sem='1' ORDER BY sub_id  ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='subject.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo $row['name'];
  echo "</a>";
  }


?></section>
            <center><h2>SEMESTER 3</h2></center>
            <section class="color-1">
				<nav class="cl-effect-14">
                <?php $result = mysql_query("SELECT * FROM sublist WHERE br_code=$br_code AND sem='3' ORDER BY sub_id ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='subject.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo $row['name'];
  echo "</a>";
  }


?></section>
 <center><h2>SEMESTER 4</h2></center>
            <section class="color-1">
				<nav class="cl-effect-14">
                <?php $result = mysql_query("SELECT * FROM sublist WHERE br_code=$br_code AND sem='4' ORDER BY sub_id  ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='subject.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo $row['name'];
  echo "</a>";
  }


?></section>
 <center><h2>SEMESTER 5</h2></center>
            <section class="color-1">
				<nav class="cl-effect-14">
                <?php $result = mysql_query("SELECT * FROM sublist WHERE br_code=$br_code AND sem='5' ORDER BY sub_id  ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='subject.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo $row['name'];
  echo "</a>";
  }


?></section>
 <center><h2>SEMESTER 6</h2></center>
            <section class="color-1">
				<nav class="cl-effect-14">
                <?php $result = mysql_query("SELECT * FROM sublist WHERE br_code=$br_code AND sem='6' ORDER BY sub_id  ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='subject.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo $row['name'];
  echo "</a>";
  }


?></section>
 <center><h2>SEMESTER 7</h2></center>
            <section class="color-1">
				<nav class="cl-effect-14">
                <?php $result = mysql_query("SELECT * FROM sublist WHERE br_code=$br_code AND sem='7' ORDER BY sub_id  ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='subject.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo $row['name'];
  echo "</a>";
  }


?></section>
 <center><h2>SEMESTER 8</h2></center>
            <section class="color-1">
				<nav class="cl-effect-14">
                <?php $result = mysql_query("SELECT * FROM sublist WHERE br_code=$br_code AND sem='8' ORDER BY sub_id  ");

while($row = mysql_fetch_array($result))
  {
  echo "<a href='subject.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo $row['name'];
  echo "</a>";
  }


?></section>
		</div><!-- /container -->
	</body>
</html>