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
		<title> BE Colleges </title>
		<meta name="description" content=" "/>
		<meta name="author" content="Dhruv Saidava" />
		<link rel="shortcut icon" href="../favicon.ico"> 
		<link rel="stylesheet" type="text/css" href="css2/default.css" />
		<link rel="stylesheet" type="text/css" href="css2/component.css" />
		<script src="js2/modernizr.custom.js"></script>
	</head>
	<body>
		<div class="container">
			<!-- Top Navigation -->
			<div class="codrops-top clearfix">
				<a class="codrops-icon codrops-icon-prev" href="http://gtupedia.com"><span>Home</span></a>
				<span class="right"><a class="codrops-icon codrops-icon-drop" href="http://facebook.com/gtupedia"><span>FB Page</span></a></span>
			</div>
			<header>
				<h1>All GTU Colleges </span></h1>	
			</header>
			<section class="color-1">
            <h3><strong>Data will be uploaded soon</strong></h3>
            </section>
			
            <center><h2>Self  Finance</h2></center>
            <section class="color-1">
<center><div><table>
<tr>
<td width="50">Code</th>
<td width="500">College Name</th>
<td width="20" align="center">Type</th>
<td width="30" align="center">Link</th>
</tr>
  <?php 
  
  $result = mysql_query("SELECT * FROM BE WHERE clge_type='SFI' ORDER BY sub_id");

while($row = mysql_fetch_array($result))
  {
  echo "<tr>";
  echo "<td>" . $row['sub_id'] . "</td>";
  echo "<td>" . $row['clge_name'] . "</td>";
  echo "</td>
  		<td>" . $row['clge_type'] . "</td>";
  echo "<td>";
  echo "<a href='college.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo "Open</a></td>";
 
  echo "</tr>";
  }
echo "</table>";
?></div>
			</section>
            <center><h2>Government College</h2></center>
            <section class="color-1">
<center><div><table>
<tr>
<td width="50">Code</th>
<td width="500">College Name</th>
<td width="20" align="center">Type</th>
<td width="30" align="center">Link</th>
</tr>
  <?php 
  
  $result = mysql_query("SELECT * FROM BE WHERE clge_type='GOVT' ORDER BY sub_id");

while($row = mysql_fetch_array($result))
  {
  echo "<tr>";
  echo "<td>" . $row['sub_id'] . "</td>";
  echo "<td>" . $row['clge_name'] . "</td>";
  echo "</td>
  		<td>" . $row['clge_type'] . "</td>";
  echo "<td>";
  echo "<a href='college.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo "Open</a></td>";
 
  echo "</tr>";
  }
echo "</table>";
?></div>
			</section>
            <center><h2>Grant Aid</h2></center>
            <section class="color-1">
<center><div><table>
<tr>
<td width="50">Code</th>
<td width="500">College Name</th>
<td width="20" align="center">Type</th>
<td width="30" align="center">Link</th>
</tr>
  <?php 
  
  $result = mysql_query("SELECT * FROM BE WHERE clge_type='G.I.A.' ORDER BY sub_id");

while($row = mysql_fetch_array($result))
  {
  echo "<tr>";
  echo "<td>" . $row['sub_id'] . "</td>";
  echo "<td>" . $row['clge_name'] . "</td>";
  echo "</td>
  		<td>" . $row['clge_type'] . "</td>";
  echo "<td>";
  echo "<a href='college.php?sub_id=";
  echo $row['sub_id'];
  echo "'>";
  echo "Open</a></td>";
 
  echo "</tr>";
  }
echo "</table>";
?></div>
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

  ga('create', 'UA-44602411-1', 'gtupedia.com');
  ga('send', 'pageview');

</script>
<!--- Google analytics -->
	</body>
</html>