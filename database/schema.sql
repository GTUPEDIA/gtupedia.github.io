-- GTUPEDIA local / Hostinger schema.
-- Re-running this file drops catalogue tables and recreates them.
-- Seed with: php database/seed.php

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS resource_items;
DROP TABLE IF EXISTS resource_topics;
DROP TABLE IF EXISTS resource_categories;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS partner_roles;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS event_categories;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS exam_paper_codes;
DROP TABLE IF EXISTS exam_paper_sets;
DROP TABLE IF EXISTS subject_alternate_ids;
DROP TABLE IF EXISTS subject_alternate_codes;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS site_meta;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE site_meta (
  meta_key VARCHAR(64) NOT NULL,
  meta_value MEDIUMTEXT NOT NULL,
  PRIMARY KEY (meta_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  code VARCHAR(8) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE branches (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(8) NOT NULL,
  branch_code VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branch (course_code, branch_code),
  KEY idx_branch_course (course_code, sort_order),
  CONSTRAINT fk_branches_course FOREIGN KEY (course_code) REFERENCES courses (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
  id VARCHAR(80) NOT NULL,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL DEFAULT '',
  course_code VARCHAR(8) NOT NULL,
  branch_code VARCHAR(16) NOT NULL,
  semester SMALLINT NULL,
  semester_label VARCHAR(80) NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_subjects_course (course_code, sort_order),
  KEY idx_subjects_code (code),
  CONSTRAINT fk_subjects_course FOREIGN KEY (course_code) REFERENCES courses (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subject_alternate_codes (
  subject_id VARCHAR(80) NOT NULL,
  code VARCHAR(32) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (subject_id, code),
  CONSTRAINT fk_alt_codes_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subject_alternate_ids (
  subject_id VARCHAR(80) NOT NULL,
  alternate_id VARCHAR(80) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (subject_id, alternate_id),
  CONSTRAINT fk_alt_ids_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_paper_sets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam VARCHAR(40) NOT NULL,
  course_code VARCHAR(8) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_paper_set (exam, course_code, base_url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_paper_codes (
  paper_set_id INT UNSIGNED NOT NULL,
  file_code VARCHAR(32) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (paper_set_id, file_code),
  KEY idx_paper_code (file_code),
  CONSTRAINT fk_paper_codes_set FOREIGN KEY (paper_set_id) REFERENCES exam_paper_sets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE team_members (
  id VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(160) NOT NULL DEFAULT '',
  course VARCHAR(80) NOT NULL DEFAULT '',
  branch VARCHAR(160) NOT NULL DEFAULT '',
  college VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(80) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL DEFAULT '',
  date_label VARCHAR(120) NOT NULL DEFAULT '',
  venue VARCHAR(255) NOT NULL DEFAULT '',
  organizer VARCHAR(255) NOT NULL DEFAULT '',
  theme VARCHAR(255) NOT NULL DEFAULT '',
  summary TEXT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_events_category (category_id, sort_order),
  CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES event_categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE internships (
  id VARCHAR(120) NOT NULL,
  company VARCHAR(160) NOT NULL,
  company_url VARCHAR(500) NOT NULL DEFAULT '',
  role VARCHAR(160) NOT NULL,
  domain VARCHAR(80) NOT NULL DEFAULT '',
  type VARCHAR(40) NOT NULL DEFAULT '',
  stipend VARCHAR(80) NOT NULL DEFAULT '',
  location VARCHAR(160) NOT NULL DEFAULT '',
  mode VARCHAR(40) NOT NULL DEFAULT '',
  duration VARCHAR(80) NOT NULL DEFAULT '',
  courses_json LONGTEXT NOT NULL,
  skills_json LONGTEXT NOT NULL,
  eligibility TEXT NULL,
  deadline VARCHAR(80) NOT NULL DEFAULT '',
  posted VARCHAR(80) NOT NULL DEFAULT '',
  summary TEXT NULL,
  apply_url VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE partner_roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role VARCHAR(120) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE partners (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  url VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_partners_role (role_id, sort_order),
  CONSTRAINT fk_partners_role FOREIGN KEY (role_id) REFERENCES partner_roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resource_categories (
  id VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  icon VARCHAR(40) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resource_topics (
  id VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resource_items (
  id VARCHAR(80) NOT NULL,
  title VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT '',
  category_id VARCHAR(40) NOT NULL,
  topics_json LONGTEXT NOT NULL,
  description TEXT NULL,
  source VARCHAR(160) NOT NULL DEFAULT '',
  recommended TINYINT(1) NOT NULL DEFAULT 0,
  tags_json LONGTEXT NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_resources_category (category_id, sort_order),
  CONSTRAINT fk_resources_category FOREIGN KEY (category_id) REFERENCES resource_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
