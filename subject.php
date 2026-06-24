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
				<span class="right"><a class="codrops-icon codrops-icon-drop" href="http://www.facebook.com/gtupedia"><span>Facebook</span></a></span>
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

?></strong></h3><br>
<a href="syllabus/<?php echo $sub_id ?>.pdf" target="_blank" ><button class="btn btn-1 btn-1a">Syllabus</button></a>	
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
            <center><h2>Study Material</h2></center><section class="color-1">
	
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
  <?php $result = mysql_query("SELECT * FROM studymaterial where sub_id=$sub_id");

while($row = mysql_fetch_array($result))
  {
	echo "<tr>";  
 	echo "<td><button class='btn btn-1 btn-1a'>".$row['cat']."</button></td>";
    echo '<td>'.$row['title'].'</td>';
    echo "<td><a href='".$row['link']."' target='_blank' ><button class='btn btn-1 btn-1a'>Click to Download</button></a></td>";
	echo '</tr><br>';
  }

?>
  	</table>
	
			</section>
         
 
                <center><h4>We apologize for the inconvenience. As part of our efforts to improve your experience we are updating our website. We look forward to serving your needs soon.</h4></center>
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
       <script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-56840753-1', 'auto');
  ga('send', 'pageview');

</script>
		<!--- Google analytics -->
	</body>
</html>