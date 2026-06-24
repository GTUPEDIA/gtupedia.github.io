<?php
$con = mysql_connect("mysql1000.mochahost.com","chirag99_dhruv","sidsai24");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

$dbs=mysql_select_db('chirag99_dhruv',$con);
$sub_id=$_GET['sub_id'];

?>
<!DOCTYPE html>
<html lang="en" class="no-js">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"> 
		<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
		<title><?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");
		

while($row = mysql_fetch_array($result))
  {
  echo $row['name'] . "-" . $row['sub_id'];
  echo '-';
  echo 'Ebooks';
  echo '-';
  echo 'Exam papers';
  echo '-';
  echo 'Syllabus';
  echo '-';
  echo 'Material';
  echo '-';
  echo 'Solution';
  echo '-';
  echo 'GTU';
  }
?><?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['field'];
  }

?></title>
<!-- Google Chrome Frame for IE -->
			<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
			
			<meta HTTP-EQUIV="Content-language" CONTENT="en">
			
			<!-- SEO meta tags -->
			<meta name="googlebot" content="index,follow" />    
			<meta name="robots" content="index,follow" />    
			<meta name="msnbot" content="index,follow" />
			
			
			
			
			<!-- mobile meta (hooray!) -->
			<meta name="HandheldFriendly" content="True">
			<meta name="MobileOptimized" content="320">
            
            <meta property="og:title" content="<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['name'];
  }

?> | <?php echo $sub_id ?>" />
			<meta property="og:type" content="article" />
			<meta property="og:image" content="http://images/fb/temp.png" />
			<meta property="og:url" content="http://gtupedia.com/<?php echo $sub_id ?>.html" />
			<meta property="og:site_name" content="GTUPEDIA" />
			<meta property="og:description" content="<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['name'];
  }

?> | <?php echo $sub_id ?>  <?php 
  
  $result = mysql_query("SELECT * FROM syllabus where sub_id=$sub_id ");

while($row = mysql_fetch_array($result))
  {
  echo " " . $row['mod_title'] . " ";
  echo ",";
  
  }
?>" />
			<meta property="og:locale" content="en_US" />
			<meta name="title" content="<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
 echo $row['name'] . "-" . $row['sub_id'];
  echo '-';
  echo 'Ebooks';
  echo '-';
  echo 'Exam papers';
  echo '-';
  echo 'Syllabus';
  echo '-';
  echo 'Material';
  echo '-';
  echo 'Solution';
  echo '-';
  echo 'GTU';
  }
?>, levelling">
		<META NAME="ROBOTS" CONTENT="INDEX, FOLLOW">
        <meta name="keywords" content="<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['name'] . "," . $row['sub_id'];
  echo ',';
  echo 'Ebooks';
  echo ',';
  echo 'Exam papers';
  echo ',';
  echo 'Syllabus';
  echo ',';
  echo 'Material';
  echo ',';
  echo 'Solution';
  echo ',';
  echo 'GTU';
  }
?><?php 
  
  $result = mysql_query("SELECT * FROM syllabus where sub_id=$sub_id ");

while($row = mysql_fetch_array($result))
  {
  echo " " . $row['mod_title'];
  echo ",";
  
  }
?>" />
        <meta name="description" content="
<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['name'];
  }

?> | <?php echo $sub_id ?>  <?php 
  
  $result = mysql_query("SELECT * FROM syllabus where sub_id=$sub_id ");

while($row = mysql_fetch_array($result))
  {
  echo " " . $row['mod_title'] . " ";
  echo ",";
  
  }
?>" />
		<meta name="author" content="Dhruv Saidava" />
        <link rel="canonical" href="http://gtupedia.com/<?php echo $sub_id ?>.html" />
		<link rel="shortcut icon" href="../favicon.ico"> 
		<link rel="stylesheet" type="text/css" href="css2/default.css" />
		<link rel="stylesheet" type="text/css" href="css2/component.css" />
		<script src="js2/modernizr.custom.js"></script>
	</head>
	<body>
		<div class="container">
			<!-- Top Navigation -->
			<div class="codrops-top clearfix">
				<a class="codrops-icon codrops-icon-prev" href="index.php"><span>Home</span></a>
				<span class="right"><a class="codrops-icon codrops-icon-drop" href="gate13.php"><span>GATE</span></a></span>
			</div>
			<header>
				<h1><?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['name'] . " | " . $row['sub_id'];
  }

?> <span><?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['year'];
  }

?> SEM Engineering</span></h1>	
			</header>
			<section class="color-1">
            <h3><strong> Credits : - <?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['COL 5'];
  }

?>(theory)&nbsp;+&nbsp;<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['COL 6'];
  }

?>(practical)&nbsp;+&nbsp;<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['COL 7'];
  }

?>(tutorial)&nbsp;=&nbsp;<?php $result = mysql_query("SELECT * FROM subjects where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo $row['COL 8'];
  }

?></strong></h3>
            </section>
			<center><h2>Question Papers</h2></center><section class="color-1">
<?php	
	if ($sub_id<"190000" && $sub_id>"180000")
  {
  include('sem8.php');
  }
elseif ($sub_id<"180000" && $sub_id>"170000")
  {
  include('sem7.php');
  }
else
  {
  include('semall.php');
  }
?>
			
			</section>
            <center><h2>PPTs & PDFs</h2></center>
            <section class="color-1">
<center><div><table>
<tr>
<td width="300">Title</th>
<td width="50">Author</th>
<td width="20" align="center">Link</th>
</tr>
  <?php 
  
  $result = mysql_query("SELECT * FROM presentations where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo "<tr>";
  echo "<td>" . $row['title_ppt'] . "</td>";
  echo "<td>" . $row['auther_ppt'] . "</td>";
  echo "</td>
    <td><div align='center'><a href='" . $row['link_ppt'] . "'><button class='btn btn-1 btn-1a'>Download</button></a></div></td>";
 
  echo "</tr>";
  }
echo "</table>";
?></div>
			</section>
 
 
 <center><h2>Open Course Ware & Web Links</h2></center>
 <section class="color-1">
<center><div>
<table>
<tr>
<td width="300">Title</th>
<td width="50">Author</th>
<td width="20" align="center">Link</th>
</tr>
  <?php 
  
  $result = mysql_query("SELECT * FROM ocwwl where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo "<tr>";
  echo "<td>" . $row['title_ppt'] . "</td>";
  echo "<td>" . $row['auther_ppt'] . "</td>";
  echo "</td>
    <td><div align='center'><a href='" . $row['link_ppt'] . "'><button class='btn btn-1 btn-1a'>Download</button></a></div></td>";
 
  echo "</tr>";
  }
echo "</table>";
?></div>
 </section>
 
 <center><h2>Syllabus</h2></center>
 <section class="color-1">
 <center><div>
<table border="1" cellspacing="0" bordercolor="#FFFFFF">
<tr>
<td width="20"><b>Module No.</b></th>
<td width="80">Topic</th>
<td width="500" align="center">Details</th>
</tr>
  <?php 
  include('de/php/connection.php');
  $result = mysql_query("SELECT * FROM syllabus where sub_id=$sub_id ORDER BY mod_no");

while($row = mysql_fetch_array($result))
  {
  echo "<tr>";
  echo "<td>" . urldecode($row['mod_no']) . "</td>";
  echo "<td>" . urldecode($row['mod_title']) . "</td>";
  echo "<td>" . urldecode($row['mod_des']) . "</td>";
  echo "</tr>";
  }
 include('de/php/disconnection.php');
echo "</table>";
?></div>
                </section>
 <?php
$con = mysql_connect("mysql1000.mochahost.com","chirag99_dhruv","sidsai24");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

$dbs=mysql_select_db('chirag99_dhruv',$con);
$sub_id=$_GET['sub_id'];

?>
 <center><h2>Refrence Book</h2></center>
 <section class="color-1">
 <center><div>
<table>
<tr>
<td width="20">Title</th>
<td width="50">Author</th>
<td width="50">Publisher</th>
</tr>
  <?php 
  
  $result = mysql_query("SELECT * FROM Book where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
  echo "<tr>";
  echo "<td>" . $row['book_title'] . "</td>";
  echo "<td>" . $row['author_name'] . "</td>";
  echo "<td>" . $row['publisher'] . "</td>";
  echo "</tr>";
  }
echo "</table>";
?></div>
                </section>
 <center><h2>Videos</h2></center>
 <section class="color-1">
  <?php 
  
  $result = mysql_query("SELECT * FROM vid where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
	  echo "<h1>";
  echo  $row [ 'title_ppt'];
  echo "</h1>";
  echo "<br>";
  echo "<br>";
  
  echo "<iframe width='560' height='315' src='//";
  echo   $row['link_ppt'];
  echo "' frameborder='0' allowfullscreen></iframe>";
  echo "<br>";
  echo "<br>";
  }
?>
 
                <center>The Content belongs to its respective authors</center>
                </section>
			
		<!-- /container -->
		<script src="js2/classie.js"></script>
		<script>
			var buttons7Click = Array.prototype.slice.call( document.querySelectorAll( '#btn-click button' ) ),
				buttons9Click = Array.prototype.slice.call( document.querySelectorAll( 'button.btn-8g' ) ),
				totalButtons7Click = buttons7Click.length,
				totalButtons9Click = buttons9Click.length;

			buttons7Click.forEach( function( el, i ) { el.addEventListener( 'click', activate, false ); } );
			buttons9Click.forEach( function( el, i ) { el.addEventListener( 'click', activate, false ); } );

			function activate() {
				var self = this, activatedClass = 'btn-activated';

				if( classie.has( this, 'btn-7h' ) ) {
					// if it is the first of the two btn-7h then activatedClass = 'btn-error';
					// if it is the second then activatedClass = 'btn-success'
					activatedClass = buttons7Click.indexOf( this ) === totalButtons7Click-2 ? 'btn-error' : 'btn-success';
				}
				else if( classie.has( this, 'btn-8g' ) ) {
					// if it is the first of the two btn-8g then activatedClass = 'btn-success3d';
					// if it is the second then activatedClass = 'btn-error3d'
					activatedClass = buttons9Click.indexOf( this ) === totalButtons9Click-2 ? 'btn-success3d' : 'btn-error3d';
				}

				if( !classie.has( this, activatedClass ) ) {
					classie.add( this, activatedClass );
					setTimeout( function() { classie.remove( self, activatedClass ) }, 1000 );
				}
			}

			document.querySelector( '.btn-7i' ).addEventListener( 'click', function() {
				classie.add( document.querySelector( '#trash-effect' ), 'trash-effect-active' );
			}, false );
		</script>
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