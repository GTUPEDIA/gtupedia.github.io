<?php

require dirname(__DIR__) . '/bootstrap.php';

gtu_json(gtu_repo()->subjectsForCourse(gtu_course_param()));
