-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: simplenote
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_chat_usage`
--

DROP TABLE IF EXISTS `ai_chat_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_chat_usage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL COMMENT '用户ID',
  `question` text COMMENT '用户问题',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI对话使用记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_chat_usage`
--

LOCK TABLES `ai_chat_usage` WRITE;
/*!40000 ALTER TABLE `ai_chat_usage` DISABLE KEYS */;
INSERT INTO `ai_chat_usage` VALUES (1,'5','我这个月花了多少钱？','2026-02-13 11:18:10'),(2,'5','我这个月花了多少钱？','2026-02-13 11:18:20'),(3,'5','给我一些省钱建议','2026-02-13 11:18:45'),(4,'11','我这个月花了多少钱？','2026-02-13 15:23:21'),(5,'11','给我一些省钱建议','2026-02-13 15:23:47'),(6,'12','我这个月花了多少钱？','2026-02-14 10:31:00'),(7,'12','给一些省钱建议','2026-02-14 10:31:18'),(8,'12','我这个月花了多少钱？','2026-02-14 10:51:54'),(9,'16','我这个月花了多少钱？','2026-02-17 10:21:49'),(10,'15','我这个月花了多少钱？','2026-02-17 11:07:25'),(11,'15','我这个月花了多少钱？','2026-02-17 11:18:47'),(12,'15','哪个分类花费最多？','2026-02-17 15:39:37'),(13,'15','我这个月花了多少钱？','2026-02-18 05:27:28'),(14,'15','哪个分类花费最多？','2026-02-18 07:38:02'),(15,'15','给我一些省钱建议','2026-02-18 07:43:15'),(16,'15','我这个月花了多少钱？','2026-02-19 03:51:32'),(17,'15','我这个月花了多少钱？','2026-02-19 09:46:35'),(18,'15','哪个分类花费最多？','2026-02-23 03:06:09'),(19,'17','给我一些省钱建议','2026-02-23 03:12:07'),(20,'17','我这个月花了多少钱？','2026-02-23 03:12:25'),(21,'15','哪个分类花费最多？','2026-02-23 03:14:08'),(22,'15','哪个分类花费最多？','2026-02-23 03:43:53'),(23,'15','哪个分类花费最多？','2026-02-24 03:07:04'),(24,'15','我这个月花了多少钱？','2026-02-24 03:07:18'),(25,'15','我这个月花了多少钱？','2026-02-24 07:18:24'),(26,'15','哪个分类花费最多？','2026-02-25 03:19:59'),(27,'15','我这个月花了多少钱？','2026-02-25 03:20:15'),(28,'15','我这个月花了多少钱？','2026-02-26 08:12:42'),(29,'15','哪个分类花费最多？','2026-02-26 08:15:01'),(30,'15','我这个月花了多少钱？','2026-02-26 08:16:43'),(36,'15','我这个月花了多少钱？','2026-02-28 16:27:33'),(37,'15','我这个月花了多少钱？','2026-02-28 16:32:43'),(38,'15','我这个月花了多少钱？','2026-02-28 16:38:23'),(39,'15','我这个月花了多少钱？','2026-02-28 16:41:28'),(40,'15','给我一些省钱建议','2026-02-28 17:40:11'),(41,'15','哪个分类花费最多？','2026-03-01 11:19:31'),(42,'15','我这个月花了多少钱？','2026-03-01 11:19:43'),(43,'15','我这个月花了多少钱？','2026-03-01 11:22:39'),(44,'15','给我一些省钱建议','2026-03-01 11:25:18'),(45,'15','我的消费趋势如何？','2026-03-01 11:27:25'),(46,'17','我这个月花了多少钱？','2026-03-01 14:18:00'),(47,'17','我这个月花了多少钱？','2026-03-01 14:19:52'),(48,'17','给我一些省钱建议','2026-03-01 14:20:04'),(49,'15','哪个分类花费最多？','2026-03-02 09:40:52'),(50,'15','我这个月花了多少钱？','2026-03-02 09:41:12'),(51,'15','我这个月花了多少钱？','2026-03-02 17:33:53'),(52,'15','我的消费趋势如何？','2026-03-02 19:45:03');
/*!40000 ALTER TABLE `ai_chat_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `android_qrcode`
--

DROP TABLE IF EXISTS `android_qrcode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `android_qrcode` (
  `id` int NOT NULL AUTO_INCREMENT,
  `qrcode_url` varchar(500) NOT NULL COMMENT '二维码URL',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='安卓二维码表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `android_qrcode`
--

LOCK TABLES `android_qrcode` WRITE;
/*!40000 ALTER TABLE `android_qrcode` DISABLE KEYS */;
INSERT INTO `android_qrcode` VALUES (1,'https://api.qiannaqule.top/uploads/qrcode/android-qrcode-1772271495190.jpg','2026-02-14 07:36:17','2026-02-28 17:38:15');
/*!40000 ALTER TABLE `android_qrcode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_config`
--

DROP TABLE IF EXISTS `app_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text COMMENT '配置值',
  `config_type` varchar(50) DEFAULT 'string' COMMENT '配置类型: string, boolean, number, json',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=366 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='应用配置表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_config`
--

LOCK TABLES `app_config` WRITE;
/*!40000 ALTER TABLE `app_config` DISABLE KEYS */;
INSERT INTO `app_config` VALUES (1,'show_ai_advisor','false','boolean','是否显示AI财务顾问功能','2026-02-18 09:59:34','2026-02-18 10:22:42'),(3,'show_ai_advisor_huawei','false','boolean','华为应用市场是否显示AI财务顾问','2026-02-18 10:18:48','2026-02-18 10:26:30'),(4,'show_ai_advisor_xiaomi','false','boolean','小米应用商店是否显示AI财务顾问','2026-02-18 10:18:48','2026-02-18 10:53:45'),(5,'show_ai_advisor_oppo','false','boolean','OPPO软件商店是否显示AI财务顾问','2026-02-18 10:18:48','2026-02-18 10:26:38'),(6,'show_ai_advisor_vivo','false','boolean','vivo应用商店是否显示AI财务顾问','2026-02-18 10:18:48','2026-02-18 10:26:42'),(7,'show_ai_advisor_honor','false','boolean','荣耀应用市场是否显示AI财务顾问','2026-02-18 10:18:48','2026-02-18 10:26:47'),(8,'show_ai_advisor_ios','false','boolean','iOS App Store是否显示AI财务顾问','2026-02-18 10:18:48','2026-02-18 10:26:51'),(9,'show_ai_advisor_wechat','false','boolean','微信小程序是否显示AI财务顾问','2026-02-18 10:18:48','2026-03-03 02:24:08'),(67,'show_voice_record','false','boolean','是否显示语音记账入口','2026-02-19 07:41:14','2026-02-26 06:26:49');
/*!40000 ALTER TABLE `app_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_versions`
--

DROP TABLE IF EXISTS `app_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_versions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `platform` varchar(20) NOT NULL COMMENT '平台: Android/iOS',
  `version` varchar(20) NOT NULL COMMENT '版本号',
  `update_content` json NOT NULL COMMENT '更新内容数组',
  `package_size` varchar(20) NOT NULL COMMENT '安装包大小',
  `download_url` varchar(500) NOT NULL COMMENT '下载地址',
  `is_force` tinyint(1) DEFAULT '0' COMMENT '是否强制更新',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_platform_version` (`platform`,`version`),
  KEY `idx_platform` (`platform`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='APP版本管理表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_versions`
--

LOCK TABLES `app_versions` WRITE;
/*!40000 ALTER TABLE `app_versions` DISABLE KEYS */;
INSERT INTO `app_versions` VALUES (13,'Android','1.1.1','[\"功能优化\"]','22.31MB','https://api.qiannaqule.top/uploads/apk/qiannaqule-1772271490032.apk',0,'2026-02-28 17:38:17','2026-02-28 17:38:17');
/*!40000 ALTER TABLE `app_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `type` varchar(20) DEFAULT 'expense',
  `amount` decimal(10,2) NOT NULL,
  `merchant` varchar(200) DEFAULT NULL,
  `date` date NOT NULL,
  `category_id` int DEFAULT NULL,
  `category_name` varchar(50) DEFAULT NULL,
  `note` text,
  `create_time` bigint DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`,`date`)
) ENGINE=InnoDB AUTO_INCREMENT=303 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (63,'14','expense',10.00,'天门市第一人民医院营养食堂','2026-02-12',1,'餐饮',NULL,1770868154802,'2026-02-17 09:04:48'),(64,'14','expense',25.00,'天门市第一人民医院营养食堂','2026-02-12',1,'餐饮',NULL,1770876858838,'2026-02-17 09:04:48'),(65,'14','expense',11.00,'医院邻里生活便利店','2026-02-12',13,'零食',NULL,1770876980339,'2026-02-17 09:04:48'),(66,'14','expense',4.00,'天门市第一人民医院营养食堂','2026-02-11',1,'餐饮',NULL,1770877897148,'2026-02-17 09:04:48'),(67,'14','income',200.00,'微信转账','2026-02-10',108,'其他',NULL,1770877929158,'2026-02-17 09:04:48'),(68,'14','expense',20.00,'天门市第一人民医院营养食堂','2026-02-11',1,'餐饮',NULL,1770878081155,'2026-02-17 09:04:48'),(69,'14','expense',17.00,'天门市第一人民医院营养食堂','2026-02-11',1,'餐饮',NULL,1770878172527,'2026-02-17 09:04:48'),(70,'14','expense',29.00,'天门市第一人民医院营养食堂','2026-02-12',1,'餐饮',NULL,1770899554985,'2026-02-17 09:04:48'),(71,'14','expense',6.00,'天门市第一人民医院营养食堂','2026-02-13',1,'餐饮',NULL,1770940286005,'2026-02-17 09:04:48'),(72,'14','expense',8.00,'天门市第一人民医院营养食堂','2026-02-13',1,'餐饮',NULL,1770959488962,'2026-02-17 09:04:48'),(73,'14','expense',18.00,'天门市第一人民医院营养食堂','2026-02-13',1,'餐饮',NULL,1771028078367,'2026-02-17 09:04:48'),(74,'14','expense',6.00,'天门市第一人民医院营养食堂','2026-02-14',1,'餐饮',NULL,1771032190454,'2026-02-17 09:04:48'),(75,'14','expense',6.00,NULL,'2026-02-15',1,'餐饮',NULL,1771210774746,'2026-02-17 09:04:48'),(76,'14','expense',4.00,'小卖部','2026-02-16',6,'医疗',NULL,1771251868103,'2026-02-17 09:04:48'),(215,'15','expense',22.00,'享道出行(上海)科技股份有限公司','2026-01-10',2,'交通','加班产品上线发布',1771341517849,'2026-02-17 15:18:38'),(216,'15','expense',7.19,'淘宝闪购-25','2026-01-31',1,'餐饮','经典毛豆烧鸡、小份米饭、卤翅根',1771341544445,'2026-02-17 15:19:04'),(221,'15','expense',250.00,'网购衣服。','2026-02-17',3,'购物','网购衣服。',1771342287286,'2026-02-17 15:31:27'),(222,'15','income',7000.00,'工资','2026-02-17',101,'工资','工资。',1771342300522,'2026-02-17 15:31:40'),(232,'15','expense',5.60,'苏果鼓楼便利店','2026-02-04',3,'购物','二丁包、鲜肉包',1771385722560,'2026-02-18 03:35:22'),(233,'15','expense',7.19,'淘宝闪购-南京龙湖河西天街店','2026-01-31',1,'餐饮','经典毛豆烧鸡、小份米饭、卤翅根',1771388734231,'2026-02-18 04:25:34'),(236,'15','expense',7.19,'南京龙湖河西天街店','2026-01-31',1,'餐饮','经典毛豆烧鸡、小份米饭、卤翅根',1771389217588,'2026-02-18 04:33:37'),(240,'15','expense',24.96,'厨大食堂','2026-02-06',1,'餐饮','米饭、汤、原价称重菜品',1771390048892,'2026-02-18 04:47:29'),(241,'15','expense',7.19,'淘宝闪购','2020-01-31',1,'餐饮','经典毛豆烧鸡、小份米饭、卤翅根',1771390092466,'2026-02-18 04:48:12'),(243,'15','income',200.00,'朋友的红包','2026-02-18',104,'红包','红包',1771390140634,'2026-02-18 04:49:00'),(245,'15','expense',5.06,'好想来','2026-02-03',13,'零食','蓓嘉乐米果系列、鑫小亲新小平包扁桃仁系',1771395792049,'2026-02-18 06:23:12'),(246,'15','expense',270.00,'拼多多','2026-02-18',8,'服饰','衣服',1771397136631,'2026-02-18 06:45:36'),(250,'15','expense',5.60,'苏果超市','2026-02-04',3,'购物','二丁包(燕诚)、鲜肉包',1771400538292,'2026-02-18 07:42:18'),(252,'15','income',500.00,'朋友的红包，','2026-02-18',104,'红包','红包',1771414704627,'2026-02-18 11:38:24'),(253,'15','expense',37.00,'滴滴','2026-02-18',2,'交通','滴滴打车',1771422948343,'2026-02-18 13:55:48'),(254,'15','income',3500.00,'工资','2026-02-18',101,'工资','工资',1771422961021,'2026-02-18 13:56:01'),(255,'15','expense',36.00,'滴滴','2026-02-19',2,'交通','滴滴打车。',1771488178603,'2026-02-19 08:02:58'),(256,'15','expense',5.06,'好想来','2026-02-03',13,'零食','蓓嘉乐米果系列、鑫小亲新小平包扁桃仁系',1771488218878,'2026-02-19 08:03:39'),(257,'17','expense',20.00,'安庆小吃','2026-02-23',1,'餐饮','',1771816271595,'2026-02-23 03:11:11'),(258,'15','expense',5.06,'好想来','2026-02-03',13,'零食','蓓嘉乐米果系列、鑫小亲新小平包扁桃仁系列',1771827038909,'2026-02-23 06:10:39'),(259,'20','expense',18.00,'鼎味缘大碗面','2026-02-24',1,'餐饮','鼎味缘大碗面',1771917877554,'2026-02-24 07:24:37'),(260,'15','income',8000.00,'工资。','2026-02-24',101,'工资','工资。',1771921502063,'2026-02-24 08:25:02'),(261,'15','expense',37.00,'午餐。','2026-02-24',1,'餐饮','午餐',1771921516348,'2026-02-24 08:25:16'),(262,'15','income',200.00,'朋友红包。','2026-02-24',104,'红包','朋友红包。',1771921904546,'2026-02-24 08:31:44'),(263,'15','expense',36.00,'午餐。','2026-02-24',1,'餐饮','午餐',1771921935172,'2026-02-24 08:32:15'),(264,'15','income',300.00,'朋友的红包，','2026-02-24',104,'红包','收到朋友的红包',1771922315596,'2026-02-24 08:38:35'),(265,'15','income',300.00,'朋友的红包，。','2026-02-24',104,'红包','朋友的红包，。',1771924329198,'2026-02-24 09:12:09'),(266,'15','income',200.00,'朋友的红包，','2026-02-24',104,'红包','红包',1771929037958,'2026-02-24 10:30:38'),(267,'15','expense',36.00,'滴滴','2026-02-24',2,'交通','滴滴打车。',1771929684917,'2026-02-24 10:41:25'),(268,'15','expense',38.00,'滴滴','2026-02-24',2,'交通','滴滴打车，。',1771932166020,'2026-02-24 11:22:46'),(269,'15','expense',5.06,'好想来','2026-02-03',13,'零食','蓓嘉乐米果系列、鑫小亲新小平包扁桃仁系列',1771932184476,'2026-02-24 11:23:04'),(270,'15','expense',45.00,'滴滴','2026-02-24',2,'交通','滴滴打车，。',1771935544934,'2026-02-24 12:19:05'),(271,'15','income',8900.00,'年终奖','2026-02-24',103,'奖金','年终奖',1771935560324,'2026-02-24 12:19:20'),(272,'15','expense',5.60,'苏果鼓楼便利店','2026-02-24',13,'零食','鲜肉包',1771937892669,'2026-02-24 12:58:12'),(273,'15','expense',35.00,'滴滴','2026-02-25',2,'交通','滴滴打车',1771990135445,'2026-02-25 03:28:55'),(274,'15','expense',33.36,'好想来','2026-02-22',13,'零食','克拉沙果仁面包系列、幸运红烧排骨风味面、香巴佬鸭根系列',1771991472221,'2026-02-25 03:51:12'),(275,'15','expense',36.00,'午餐','2026-02-25',1,'餐饮','午餐',1771991826261,'2026-02-25 03:57:06'),(276,'15','expense',7.19,'淘宝闪购-25','2026-01-31',1,'餐饮','经典毛豆烧鸡、小份米饭、卤翅根',1771991942729,'2026-02-25 03:59:03'),(277,'17','expense',36.00,'滴滴','2026-02-25',2,'交通','滴滴打车。',1771995867588,'2026-02-25 05:04:27'),(278,'17','expense',33.36,'好想来','2026-02-22',13,'零食','克拉沙果仁面包系列、幸运红烧排骨风味面、统一小浣熊干脆面',1771995892178,'2026-02-25 05:04:52'),(279,'17','expense',33.36,'好想来','2026-02-22',13,'零食','克拉沙果仁面包系列、幸运红烧排骨风味面、统一小浣熊干脆面',1771996010377,'2026-02-25 05:06:50'),(280,'15','expense',36.00,'滴滴','2026-02-25',2,'交通','滴滴打车。',1772009799575,'2026-02-25 08:56:39'),(281,'15','expense',20.00,'安庆小吃','2026-02-26',1,'餐饮','',1772094244050,'2026-02-26 08:24:04'),(282,'15','expense',22.00,'享道出行','2026-01-10',2,'交通','加班产品上线发布',1772094427105,'2026-02-26 08:27:07'),(283,'15','expense',5.06,'好想来','2026-02-03',3,'购物','蓓嘉乐米果',1772094444013,'2026-02-26 08:27:24'),(284,'17','expense',14.00,'安庆小吃','2026-02-26',1,'餐饮','鸡腿饭',1772101546522,'2026-02-26 10:25:46'),(286,'15','expense',50.00,'滴滴','2026-02-26',2,'交通','滴滴打车。',1772109477827,'2026-02-26 12:37:58'),(287,'15','expense',38.00,'滴滴','2026-02-27',2,'交通','滴滴打车，。',1772191658435,'2026-02-27 11:27:38'),(288,'15','expense',25.00,'午餐。','2026-02-27',1,'餐饮','午餐。',1772191684956,'2026-02-27 11:28:05'),(289,'15','expense',5.06,'好想来','2026-02-03',3,'购物','蓓嘉乐米果',1772191711695,'2026-02-27 11:28:31'),(290,'15','expense',38.00,'星巴克','2026-02-27',1,'餐饮','星巴克。',1772194908004,'2026-02-27 12:21:48'),(291,'15','expense',6.98,'好想来','2026-02-01',13,'零食','贪柒猫酸砂系列, 蓓嘉乐米果系列, 鑫小亲新小平包扁桃仁系列',1772260504117,'2026-02-28 14:35:04'),(294,'17','expense',38.00,'滴滴','2026-03-01',2,'交通','滴滴打车',1772345934766,'2026-03-01 14:18:55'),(295,'17','expense',10.00,'买水饺，十块钱。','2026-03-01',3,'购物','买水饺，花了十块钱。',1772346060470,'2026-03-01 14:21:00'),(297,'15','expense',6.98,'好想来','2026-02-01',13,'零食','贪柒猫酸砂系列, 蓓嘉乐米果系列, 鑫小亲新小平包扁桃仁系列',1772451962642,'2026-03-02 19:46:02'),(298,'15','expense',39.00,'滴滴','2026-03-02',2,'交通','滴滴打车',1772452055039,'2026-03-02 19:47:35'),(301,'15','expense',7.19,'淘宝闪购-25','2026-01-31',1,'餐饮','2份餐具 菜品名称数量金额 1.经典毛豆烧鸡 116.0 2.小份米饭11.00 3.卤翅根 11.99 数量合计 3 配送费:2.00餐费:2.20 金额:7.19 38',1772507631208,'2026-03-03 11:13:51'),(302,'15','expense',22.00,'享道出行(上海)科技股份有限公司','2026-01-10',2,'交通','加班产品上线发布',1772507651086,'2026-03-03 11:14:11');
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (1,'oNiMK0YhSHO2vvYsCjGIBexy8bUw',200.00,'2026-02-17 08:31:36','2026-02-17 08:31:36'),(2,'15',8000.00,'2026-02-17 11:40:45','2026-02-17 11:40:45'),(4,'41',2000.00,'2026-03-01 05:53:33','2026-03-01 05:53:33');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `images` json DEFAULT NULL,
  `user_info` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (15,15,'不错','[\"https://api.qiannaqule.top/uploads/1771342808948-255053380.jpg\", \"https://api.qiannaqule.top/uploads/1771342809120-439216140.jpg\", \"https://api.qiannaqule.top/uploads/1771342809217-640096580.jpg\"]','{\"phone\": \"17682824692\", \"nickname\": \"胡歌2\"}','2026-02-17 15:40:09'),(18,14,'你好，之前抢了红包🧧，不知道为什么抢的积分没有在“我的”里面显示，我没有管，但是几天没有登录记账，今天登录发现积分清零了，记的账也有问题，快有100笔记账了，很多重复的，不是我之前记的','[\"https://api.qiannaqule.top/uploads/1771902963318-965952108.jpg\", \"https://api.qiannaqule.top/uploads/1771902963476-47910274.jpg\", \"https://api.qiannaqule.top/uploads/1771902963649-40470604.jpg\"]','{\"phone\": null, \"nickname\": \"别乱花 可买可不买就不买\"}','2026-02-24 03:16:03'),(19,15,'产品不错','[\"https://api.qiannaqule.top/uploads/1772099406586-581405525.jpg\", \"https://api.qiannaqule.top/uploads/1772099406721-753617752.jpg\", \"https://api.qiannaqule.top/uploads/1772099406808-879940979.jpg\"]','{\"phone\": \"17682824692\", \"nickname\": \"胡歌\"}','2026-02-26 09:50:06');
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ip_blacklist`
--

DROP TABLE IF EXISTS `ip_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ip_blacklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(50) NOT NULL COMMENT 'IP地址',
  `reason` varchar(200) DEFAULT NULL COMMENT '拉黑原因',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否生效：1生效，0失效',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_ip` (`ip_address`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='IP黑名单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ip_blacklist`
--

LOCK TABLES `ip_blacklist` WRITE;
/*!40000 ALTER TABLE `ip_blacklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `ip_blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL COMMENT 'ç”¨æˆ·ID',
  `action` varchar(100) DEFAULT NULL COMMENT 'æ“ä½œç±»åž‹',
  `module` varchar(50) DEFAULT NULL COMMENT 'æ¨¡å—',
  `method` varchar(10) DEFAULT NULL COMMENT 'è¯·æ±‚æ–¹æ³•',
  `path` varchar(255) DEFAULT NULL COMMENT 'è¯·æ±‚è·¯å¾„',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IPåœ°å€',
  `user_agent` text COMMENT 'ç”¨æˆ·ä»£ç†',
  `request_body` text COMMENT 'è¯·æ±‚ä½“',
  `response_status` int DEFAULT NULL COMMENT 'å“åº”çŠ¶æ€ç ',
  `error_message` text COMMENT 'é”™è¯¯ä¿¡æ¯',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ç³»ç»Ÿæ—¥å¿—è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES (1,1,'ç”¨æˆ·ç™»å½•','auth','POST','/api/login','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(2,1,'æŸ¥çœ‹è´¦å•åˆ—è¡¨','bills','GET','/api/bills','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(3,2,'åˆ›å»ºè´¦å•','bills','POST','/api/bills','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(4,1,'æŸ¥çœ‹ç”¨æˆ·ä¿¡æ¯','user','GET','/api/user/info','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(5,3,'ä¿®æ”¹è´¦å•','bills','PUT','/api/bills/123','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(6,2,'åˆ é™¤è´¦å•','bills','DELETE','/api/bills/456','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(7,1,'å¯¼å‡ºè´¦å•','bills','GET','/api/bills/export','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(8,4,'ç”¨æˆ·æ³¨å†Œ','auth','POST','/api/register','192.168.1.100',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(9,1,'ä¿®æ”¹å¯†ç ','user','POST','/api/user/password','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19'),(10,2,'æŸ¥çœ‹ç»Ÿè®¡æ•°æ®','stats','GET','/api/stats','127.0.0.1',NULL,NULL,200,NULL,'2026-02-11 12:55:19');
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phone_blacklist`
--

DROP TABLE IF EXISTS `phone_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phone_blacklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `reason` varchar(200) DEFAULT NULL COMMENT '拉黑原因',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否生效：1生效，0失效',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='手机号黑名单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phone_blacklist`
--

LOCK TABLES `phone_blacklist` WRITE;
/*!40000 ALTER TABLE `phone_blacklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `phone_blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `points_history`
--

DROP TABLE IF EXISTS `points_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `points_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `points` int NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `metadata` text,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`,`create_time`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=186 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `points_history`
--

LOCK TABLES `points_history` WRITE;
/*!40000 ALTER TABLE `points_history` DISABLE KEYS */;
INSERT INTO `points_history` VALUES (1,'1',2,'记账','{}','2026-02-08 12:34:36'),(2,'1',2,'记账','{}','2026-02-08 12:36:53'),(3,'1',2,'记账','{}','2026-02-08 12:47:17'),(4,'1',2,'记账','{}','2026-02-08 12:47:25'),(5,'1',2,'记账','{}','2026-02-08 12:47:27'),(6,'1',2,'记账','{}','2026-02-08 12:48:01'),(7,'1',2,'记账','{}','2026-02-08 12:51:03'),(8,'1',2,'记账','{}','2026-02-08 12:51:27'),(9,'1',2,'记账','{}','2026-02-08 12:59:19'),(10,'1',2,'记账','{}','2026-02-08 13:01:06'),(11,'1',2,'记账','{}','2026-02-08 13:01:06'),(12,'1',2,'记账','{}','2026-02-08 14:02:11'),(13,'1',2,'记账','{}','2026-02-08 14:02:55'),(14,'1',2,'记账','{}','2026-02-08 14:06:12'),(15,'1',2,'记账','{}','2026-02-08 14:06:12'),(16,'1',2,'记账','{}','2026-02-08 14:07:08'),(17,'1',2,'记账','{}','2026-02-08 14:10:55'),(18,'1',2,'记账','{}','2026-02-08 14:14:06'),(19,'1',2,'记账','{}','2026-02-08 14:25:28'),(20,'1',2,'记账','{}','2026-02-08 14:25:47'),(21,'1',2,'记账','{}','2026-02-08 14:26:14'),(22,'1',2,'记账','{}','2026-02-08 14:47:39'),(23,'5',2,'记账','{}','2026-02-08 23:36:26'),(24,'7',2,'记账','{}','2026-02-10 03:45:06'),(25,'7',2,'记账','{}','2026-02-10 04:28:43'),(26,'7',2,'记账','{}','2026-02-10 05:52:49'),(27,'9',2,'记账','{}','2026-02-10 15:21:46'),(28,'9',2,'记账','{}','2026-02-10 15:22:20'),(29,'9',2,'记账','{}','2026-02-10 23:31:26'),(30,'5',2,'记账','{}','2026-02-11 14:39:04'),(31,'5',2,'记账','{}','2026-02-11 14:39:37'),(32,'5',2,'记账','{}','2026-02-11 14:41:01'),(33,'1',2,'记账','{}','2026-02-11 15:16:06'),(34,'5',2,'记账','{}','2026-02-13 05:02:04'),(35,'5',2,'记账','{}','2026-02-13 05:02:16'),(36,'11',2,'记账','{}','2026-02-13 15:21:51'),(37,'11',2,'记账','{}','2026-02-13 15:22:35'),(38,'11',2,'记账','{}','2026-02-13 15:24:22'),(39,'11',2,'记账','{}','2026-02-13 15:24:44'),(40,'11',2,'记账','{}','2026-02-13 15:25:21'),(41,'11',2,'记账','{}','2026-02-14 01:35:41'),(42,'11',2,'记账','{}','2026-02-14 01:36:38'),(43,'11',2,'记账','{}','2026-02-14 01:36:40'),(44,'11',2,'记账','{}','2026-02-14 01:36:42'),(45,'11',2,'记账','{}','2026-02-14 01:36:44'),(46,'11',2,'记账','{}','2026-02-14 01:36:46'),(47,'5',2,'记账','{}','2026-02-14 08:06:54'),(48,'5',2,'记账','{}','2026-02-14 08:06:56'),(49,'5',2,'记账','{}','2026-02-14 08:06:57'),(50,'5',2,'记账','{}','2026-02-14 08:06:59'),(51,'12',2,'记账','{}','2026-02-14 08:08:41'),(52,'12',2,'记账','{}','2026-02-14 10:27:08'),(53,'12',2,'记账','{}','2026-02-14 10:27:37'),(54,'12',2,'记账','{}','2026-02-14 10:28:02'),(55,'12',2,'记账','{}','2026-02-14 10:29:10'),(56,'12',2,'记账','{}','2026-02-14 10:29:11'),(57,'12',2,'记账','{}','2026-02-14 10:29:12'),(58,'12',2,'记账','{}','2026-02-14 10:29:13'),(59,'12',2,'记账','{}','2026-02-14 10:30:17'),(60,'12',2,'记账','{}','2026-02-14 10:47:42'),(61,'12',2,'记账','{}','2026-02-14 10:48:30'),(62,'12',2,'记账','{}','2026-02-14 10:49:12'),(63,'12',2,'记账','{}','2026-02-14 10:51:11'),(64,'12',2,'记账','{}','2026-02-14 10:52:36'),(65,'16',10,'测试添加积分','{\"type\":\"test\"}','2026-02-17 10:21:42'),(66,'15',2,'记账','{}','2026-02-17 10:30:41'),(67,'15',2,'记账','{}','2026-02-17 10:31:11'),(68,'15',2,'记账','{}','2026-02-17 10:36:55'),(69,'15',5,'设置预算','{}','2026-02-17 11:40:45'),(71,'15',2,'记账','{}','2026-02-17 13:34:13'),(72,'15',2,'记账','{}','2026-02-17 13:35:00'),(73,'15',2,'记账','{}','2026-02-17 15:18:38'),(74,'15',2,'记账','{}','2026-02-17 15:19:04'),(75,'15',2,'记账','{}','2026-02-17 15:30:07'),(76,'15',2,'记账','{}','2026-02-17 15:30:30'),(77,'15',2,'记账','{}','2026-02-17 15:30:44'),(78,'15',2,'记账','{}','2026-02-17 15:31:14'),(79,'15',2,'记账','{}','2026-02-17 15:31:27'),(80,'15',2,'记账','{}','2026-02-17 15:31:41'),(81,'15',2,'记账','{}','2026-02-17 15:35:12'),(82,'15',2,'记账','{}','2026-02-17 15:38:17'),(83,'15',2,'记账','{}','2026-02-17 15:48:15'),(84,'15',2,'记账','{}','2026-02-18 02:26:29'),(85,'15',2,'记账','{}','2026-02-18 03:02:15'),(86,'15',2,'记账','{}','2026-02-18 03:11:40'),(87,'15',2,'记账','{}','2026-02-18 03:11:58'),(88,'15',2,'记账','{}','2026-02-18 03:16:36'),(89,'15',2,'记账','{}','2026-02-18 03:26:19'),(90,'15',2,'记账','{}','2026-02-18 03:35:23'),(91,'15',2,'记账','{}','2026-02-18 04:25:34'),(92,'15',2,'记账','{}','2026-02-18 04:32:38'),(93,'15',2,'记账','{}','2026-02-18 04:32:59'),(94,'15',2,'记账','{}','2026-02-18 04:33:38'),(95,'15',2,'记账','{}','2026-02-18 04:34:16'),(96,'15',2,'记账','{}','2026-02-18 04:34:41'),(97,'15',2,'记账','{}','2026-02-18 04:47:12'),(98,'15',2,'记账','{}','2026-02-18 04:47:29'),(99,'15',2,'记账','{}','2026-02-18 04:48:13'),(100,'15',2,'记账','{}','2026-02-18 04:48:42'),(101,'15',2,'记账','{}','2026-02-18 04:49:01'),(102,'15',2,'记账','{}','2026-02-18 05:02:41'),(103,'15',2,'记账','{}','2026-02-18 06:23:12'),(104,'15',2,'记账','{}','2026-02-18 06:45:37'),(105,'15',2,'记账','{}','2026-02-18 06:47:40'),(106,'15',2,'记账','{}','2026-02-18 07:16:15'),(107,'15',2,'记账','{}','2026-02-18 07:37:34'),(108,'15',2,'记账','{}','2026-02-18 07:42:18'),(109,'15',2,'记账','{}','2026-02-18 07:42:41'),(110,'15',2,'记账','{}','2026-02-18 10:41:33'),(111,'15',2,'记账','{}','2026-02-18 10:41:34'),(112,'15',2,'记账','{}','2026-02-18 10:41:37'),(113,'15',2,'记账','{}','2026-02-18 10:41:42'),(114,'15',2,'记账','{}','2026-02-18 10:41:57'),(115,'15',2,'记账','{}','2026-02-18 10:42:05'),(116,'15',2,'记账','{}','2026-02-18 10:44:04'),(117,'15',2,'记账','{}','2026-02-18 10:44:08'),(118,'15',2,'记账','{}','2026-02-18 10:44:16'),(119,'15',2,'记账','{}','2026-02-18 10:46:10'),(120,'15',2,'记账','{}','2026-02-18 10:46:14'),(121,'15',2,'记账','{}','2026-02-18 10:49:35'),(122,'15',2,'记账','{}','2026-02-18 10:55:08'),(123,'15',2,'记账','{}','2026-02-18 10:56:09'),(124,'15',2,'记账','{}','2026-02-18 11:14:03'),(125,'15',2,'记账','{}','2026-02-18 11:22:55'),(126,'15',2,'记账','{}','2026-02-18 11:24:28'),(127,'15',2,'记账','{}','2026-02-18 11:26:20'),(128,'15',2,'记账','{}','2026-02-18 11:36:12'),(129,'15',2,'记账','{}','2026-02-18 11:36:14'),(130,'15',2,'记账','{}','2026-02-18 11:36:16'),(131,'15',2,'记账','{}','2026-02-18 11:36:21'),(132,'15',2,'记账','{}','2026-02-18 11:36:30'),(133,'15',2,'记账','{}','2026-02-18 11:38:25'),(134,'15',2,'记账','{}','2026-02-18 13:55:48'),(135,'15',2,'记账','{}','2026-02-18 13:56:01'),(136,'15',2,'记账','{}','2026-02-19 08:02:59'),(137,'15',2,'记账','{}','2026-02-19 08:03:39'),(138,'17',2,'记账','{}','2026-02-23 03:11:12'),(139,'15',2,'记账','{}','2026-02-23 06:10:39'),(140,'20',2,'记账','{}','2026-02-24 07:24:37'),(141,'15',2,'记账','{}','2026-02-24 08:25:02'),(142,'15',2,'记账','{}','2026-02-24 08:25:16'),(143,'15',2,'记账','{}','2026-02-24 08:31:45'),(144,'15',2,'记账','{}','2026-02-24 08:32:15'),(145,'15',2,'记账','{}','2026-02-24 08:38:36'),(146,'15',2,'记账','{}','2026-02-24 09:12:09'),(147,'15',2,'记账','{}','2026-02-24 10:30:38'),(148,'15',2,'记账','{}','2026-02-24 10:41:25'),(149,'15',2,'记账','{}','2026-02-24 11:22:46'),(150,'15',2,'记账','{}','2026-02-24 11:23:04'),(151,'15',2,'记账','{}','2026-02-24 12:19:05'),(152,'15',2,'记账','{}','2026-02-24 12:19:20'),(153,'15',2,'记账','{}','2026-02-24 12:58:13'),(154,'15',2,'记账','{}','2026-02-25 03:28:55'),(155,'15',2,'记账','{}','2026-02-25 03:51:12'),(156,'15',2,'记账','{}','2026-02-25 03:57:06'),(157,'15',2,'记账','{}','2026-02-25 03:59:03'),(158,'17',2,'记账','{}','2026-02-25 05:04:28'),(159,'17',2,'记账','{}','2026-02-25 05:04:52'),(160,'17',2,'记账','{}','2026-02-25 05:06:50'),(161,'15',2,'记账','{}','2026-02-25 08:56:40'),(162,'15',2,'记账','{}','2026-02-26 08:24:05'),(163,'15',2,'记账','{}','2026-02-26 08:27:07'),(164,'15',2,'记账','{}','2026-02-26 08:27:24'),(165,'17',2,'记账','{}','2026-02-26 10:25:46'),(166,'15',2,'记账','{}','2026-02-26 12:37:37'),(167,'15',2,'记账','{}','2026-02-26 12:37:58'),(168,'14',100,'数据迁移补偿',NULL,'2026-02-27 07:59:28'),(169,'14',50,'红包积分补偿',NULL,'2026-02-27 08:02:46'),(170,'15',2,'记账','{}','2026-02-27 11:27:38'),(171,'15',2,'记账','{}','2026-02-27 11:28:05'),(172,'15',2,'记账','{}','2026-02-27 11:28:32'),(173,'15',2,'记账','{}','2026-02-27 12:21:48'),(174,'15',2,'记账','{}','2026-02-28 14:35:05'),(175,'41',5,'设置预算','{}','2026-03-01 05:53:33'),(176,'41',2,'记账','{}','2026-03-01 05:53:59'),(177,'41',2,'记账','{}','2026-03-01 05:54:32'),(178,'41',2,'记账','{}','2026-03-01 05:55:33'),(179,'41',2,'记账','{}','2026-03-01 05:55:35'),(180,'17',2,'记账','{}','2026-03-01 14:18:55'),(181,'17',2,'记账','{}','2026-03-01 14:21:00'),(182,'15',2,'记账','{}','2026-03-02 19:46:02'),(183,'15',2,'记账','{}','2026-03-02 19:47:35'),(184,'15',2,'记账','{}','2026-03-03 11:13:51'),(185,'15',2,'记账','{}','2026-03-03 11:14:11');
/*!40000 ALTER TABLE `points_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `red_packet_records`
--

DROP TABLE IF EXISTS `red_packet_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `red_packet_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `morning_count` int DEFAULT '0',
  `afternoon_count` int DEFAULT '0',
  `last_grab_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`,`last_grab_time`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `red_packet_records`
--

LOCK TABLES `red_packet_records` WRITE;
/*!40000 ALTER TABLE `red_packet_records` DISABLE KEYS */;
INSERT INTO `red_packet_records` VALUES (1,'14',3,2,'2026-02-13 15:00:00');
/*!40000 ALTER TABLE `red_packet_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_logs`
--

DROP TABLE IF EXISTS `registration_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `ip_address` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text COMMENT '用户代理',
  `status` varchar(20) DEFAULT NULL COMMENT '状态：success成功，failed失败',
  `fail_reason` varchar(200) DEFAULT NULL COMMENT '失败原因',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_ip` (`ip_address`),
  KEY `idx_date` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='注册日志表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_logs`
--

LOCK TABLES `registration_logs` WRITE;
/*!40000 ALTER TABLE `registration_logs` DISABLE KEYS */;
INSERT INTO `registration_logs` VALUES (1,'13900000001','112.2.228.183','curl/8.7.1','success',NULL,'2026-02-08 04:01:30'),(2,'13900000002','112.2.228.183','curl/8.7.1','success',NULL,'2026-02-08 04:06:11'),(3,'17682824692','122.192.14.206','Mozilla/5.0 (Linux; Android 14; 2312DRAABC Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/34.18182)','success',NULL,'2026-02-08 23:36:06'),(4,'17652365236','122.192.14.206','Mozilla/5.0 (Linux; Android 14; 2312DRAABC Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/34.18182)','success',NULL,'2026-02-09 03:57:11'),(5,'17652321235','61.132.73.58','Mozilla/5.0 (Linux; Android 14; 2312DRAABC Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/34.18182)','success',NULL,'2026-02-10 03:44:34'),(6,'17623563263','122.192.15.164','Mozilla/5.0 (Linux; Android 14; 2312DRAABC Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/34.18182)','success',NULL,'2026-02-10 15:20:36'),(7,'17652365234','116.147.253.163','Mozilla/5.0 (Linux; Android 14; 2312DRAABC Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/34.18182)','success',NULL,'2026-02-13 15:19:27'),(8,'17625326536','116.147.253.215','Mozilla/5.0 (Linux; Android 14; 2312DRAABC Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/34.18182)','success',NULL,'2026-02-14 08:07:50'),(9,'17682824691','112.2.228.183','axios/1.13.4','success',NULL,'2026-02-17 10:21:41');
/*!40000 ALTER TABLE `registration_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `reminder_time` varchar(10) DEFAULT '21:00',
  `template_id` varchar(100) NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `time` varchar(10) DEFAULT '21:00',
  `last_push_date` date DEFAULT NULL,
  `last_push_time` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_enabled_time` (`enabled`,`reminder_time`),
  KEY `idx_last_push_date` (`last_push_date`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
INSERT INTO `reminders` VALUES (1,'oNiMK0YwOPP9HrrQ-rEEIuY-Z4rA','22:00','bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw',0,'22:00',NULL,NULL,'2026-02-17 08:37:33','2026-02-17 08:37:33'),(2,'oNiMK0YhSHO2vvYsCjGIBexy8bUw','08:00','bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw',0,'08:00',NULL,NULL,'2026-02-17 08:37:33','2026-02-28 00:00:02'),(3,'oNiMK0QrSLsKqfJycDB7Lu3zYYug','14:11','bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw',0,'14:20','2026-03-01','2026-03-01 14:20:02','2026-02-17 08:37:33','2026-03-01 14:25:02'),(7,'oNiMK0Z5Oiu0rFnego20Y-sGq2eE','21:00','bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw',0,'17:16','2026-02-28','2026-02-28 17:20:02','2026-02-17 12:07:48','2026-02-28 17:25:02');
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_points`
--

DROP TABLE IF EXISTS `user_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `points` int DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_points`
--

LOCK TABLES `user_points` WRITE;
/*!40000 ALTER TABLE `user_points` DISABLE KEYS */;
INSERT INTO `user_points` VALUES (1,'1',46,'2026-02-08 12:34:36','2026-02-11 15:16:06'),(2,'5',20,'2026-02-08 23:36:26','2026-02-14 08:06:59'),(3,'7',6,'2026-02-10 03:45:06','2026-02-10 05:52:49'),(4,'9',6,'2026-02-10 15:21:46','2026-02-10 23:31:26'),(5,'11',22,'2026-02-13 15:21:51','2026-02-14 01:36:46'),(6,'12',28,'2026-02-14 08:08:41','2026-02-14 10:52:36'),(7,'16',10,'2026-02-17 10:21:42','2026-02-17 10:21:42'),(8,'15',211,'2026-02-17 10:30:41','2026-03-03 11:14:11'),(10,'17',14,'2026-02-23 03:11:12','2026-03-01 14:21:00'),(11,'20',2,'2026-02-24 07:24:37','2026-02-24 07:24:37'),(12,'14',150,'2026-02-27 07:59:27','2026-02-27 08:02:46'),(13,'41',13,'2026-03-01 05:53:33','2026-03-01 05:55:35');
/*!40000 ALTER TABLE `user_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) DEFAULT NULL,
  `app_openid` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT '',
  `avatar` varchar(500) DEFAULT NULL,
  `session_key` varchar(100) DEFAULT NULL,
  `apple_id` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `account` varchar(50) DEFAULT NULL COMMENT '账号',
  `password` varchar(255) DEFAULT NULL COMMENT '密码（bcrypt加密）',
  `unionid` varchar(100) DEFAULT NULL COMMENT '微信unionid',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `platform` varchar(50) DEFAULT NULL COMMENT '注册平台',
  `source` varchar(50) DEFAULT 'organic' COMMENT '注册来源',
  `channel` varchar(100) DEFAULT NULL COMMENT '渠道标识',
  `device_brand` varchar(50) DEFAULT NULL COMMENT '设备品牌',
  `device_model` varchar(100) DEFAULT NULL COMMENT '设备型号',
  `os_version` varchar(50) DEFAULT NULL COMMENT '系统版本',
  `app_version` varchar(20) DEFAULT NULL COMMENT '应用版本',
  `register_ip` varchar(50) DEFAULT NULL COMMENT '注册IP',
  `invite_code` varchar(20) DEFAULT NULL COMMENT '邀请码',
  `inviter_id` int DEFAULT NULL COMMENT '邀请人ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `account` (`account`),
  KEY `idx_openid` (`openid`),
  KEY `idx_account` (`account`),
  KEY `idx_platform` (`platform`),
  KEY `idx_source` (`source`),
  KEY `idx_channel` (`channel`),
  KEY `idx_inviter` (`inviter_id`),
  KEY `idx_apple_id` (`apple_id`),
  KEY `idx_app_openid` (`app_openid`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (13,'oNiMK0fGXv1KVNHkzQzMEAypUDOk',NULL,NULL,'小张张','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'i/Arm2DiBhcgI9CLCIzdkw==',NULL,'2026-02-11 10:21:24','2026-02-24 01:08:47',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,'oNiMK0YhSHO2vvYsCjGIBexy8bUw',NULL,NULL,'别乱花 可买可不买就不买','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'lH8XtIWsdkRJ7ODBXJ6eZQ==',NULL,'2026-02-13 15:41:23','2026-02-24 04:12:46',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,'oNiMK0Z5Oiu0rFnego20Y-sGq2eE',NULL,'17682824692','胡歌','https://api.qiannaqule.top/uploads/1772096032572-706694958.jpg',NULL,'G+J+gTn039dEbTL5UZ+jWw==',NULL,'2026-02-17 09:36:40','2026-03-03 11:13:29',NULL,'$2b$10$N53dvX0gdliqQ.iWYo5ppOrqHGEnSMrd0IWBc8ujtlTbfe8fmBe/a',NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,'oNiMK0QrSLsKqfJycDB7Lu3zYYug',NULL,NULL,'古巨基','https://api.qiannaqule.top/uploads/1771816299100-984142936.jpg',NULL,'MpqVX0Cy7ejpQyypZvTA5Q==',NULL,'2026-02-18 12:33:59','2026-03-01 14:18:20',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,'oNiMK0evqBduxpsz8cj-wcjl7CRo',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'bTC88+PQ/Gs39T+TMGhCOg==',NULL,'2026-02-19 01:37:30','2026-03-01 13:36:51',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,'oNiMK0fodNbQYwEXQqiGeMJY3Wfs',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'Pjg46VC62WFjL+7w2H/NQQ==',NULL,'2026-02-19 12:09:25','2026-02-19 12:09:33',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,'oNiMK0enEKSrVmRXI095hq-g-z7Y',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'2+JKBHeQC4YLsKXaJ+Kwgw==',NULL,'2026-02-24 07:21:17','2026-02-28 11:44:12',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(21,'oNiMK0UaHVoSxBZ0GV3wLhAGd2c0',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'0PvGuVxXMaNsJvEGrNYKog==',NULL,'2026-02-24 07:28:24','2026-02-24 07:28:24',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(22,'oNiMK0UiqLfy4cWxBccnZ1GmAQhc',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'NvunEjAFn8xl9fjhEpq6PQ==',NULL,'2026-02-24 07:33:28','2026-02-24 07:33:28',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(23,'oNiMK0U6DauhrHy5pXNTllzWUStE',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'R8Yk/ZDbKVMNtxIb1n69ug==',NULL,'2026-02-25 06:36:01','2026-02-25 06:36:01',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(24,'oNiMK0VTGJK9wymjkJ1pelNIMNpI',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'hAk89gxNoQIhsa8OTOIcWQ==',NULL,'2026-02-25 10:20:21','2026-02-25 10:20:21',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(25,'oNiMK0e96uGNVfTJ53tB4mphEzqE',NULL,NULL,'微信用户','https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',NULL,'3xKu/Ge+qUaowpqwVQn2hw==',NULL,'2026-02-26 06:21:40','2026-02-26 06:21:40',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(26,'oNiMK0a6unkf9X_0JR5SBnMiWyaE',NULL,NULL,'微信用户','',NULL,'6rL255XckCXm37tjE/mFpw==',NULL,'2026-02-26 08:31:20','2026-02-28 01:00:29',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(27,'oNiMK0SeisduX17OMMKE7HJLxM0I',NULL,NULL,'微信用户','',NULL,'aSDpPmSegYhOy0lOVo/S7g==',NULL,'2026-02-26 08:31:22','2026-03-03 11:15:32',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(28,'oNiMK0ejbNTy2W8wHqc9oEOv995k',NULL,NULL,'微信用户','',NULL,'pzd4Tyba4KpSnW/h3aQKXQ==',NULL,'2026-02-26 08:41:30','2026-03-01 09:55:48',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(29,'oNiMK0b_NAm0cF3XeWIERJ3aivZ4',NULL,NULL,'微信用户','',NULL,'yoid6DesSPMP++ov5HoCXQ==',NULL,'2026-02-26 11:10:30','2026-02-26 11:10:30',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(30,'oNiMK0YwOPP9HrrQ-rEEIuY-Z4rA',NULL,NULL,'记账达人','https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',NULL,'ATHuBoyyne4NW6vTBD74sQ==',NULL,'2026-02-27 01:23:26','2026-02-27 01:23:26',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(31,'oNiMK0bSDQJwhNwsFwskLETbWZ5s',NULL,NULL,'微信用户','',NULL,'dLqKCST+qjnBT2n5XNSkfg==',NULL,'2026-02-27 09:08:57','2026-03-02 12:00:31',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(32,'oNiMK0ZipZKlah_c0acyAdkHxYsM',NULL,NULL,'微信用户','',NULL,'YE3ojcEfDjI6OuVzqipZhw==',NULL,'2026-02-27 09:08:58','2026-02-27 09:08:58',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(33,'oNiMK0RWWp8qNnjog1KU4qTQq29Q',NULL,NULL,'微信用户','',NULL,'nHwzZtSNVosUha2hxO+jvg==',NULL,'2026-02-27 11:28:52','2026-02-27 11:31:00',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(34,'oNiMK0YhxGJ3ADrGfJi4xSyOiNFs',NULL,NULL,'微信用户','',NULL,'8iikrmqC7V0Sx3qqbEuv6A==',NULL,'2026-02-28 01:00:30','2026-03-03 11:15:31',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(35,'oNiMK0TfJZNfg5ypIay0WZFm2K4A',NULL,NULL,'微信用户','',NULL,'+Q6zgVubq5p7Uop/WPvJGg==',NULL,'2026-02-28 11:30:03','2026-02-28 11:30:03',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(36,'oNiMK0evG4-TCzxjFvl5LhXGJgQE',NULL,NULL,'微信用户','',NULL,'eAMdoQi33zJN1UwyxU4OWg==',NULL,'2026-02-28 12:00:08','2026-02-28 16:49:25',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(37,'oNiMK0Slr4wmd1g6ynk2S1Z85FcQ',NULL,NULL,'微信用户','',NULL,'cNHxKPy8242d2mHaqUWxeA==',NULL,'2026-02-28 12:00:11','2026-02-28 16:49:24',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(38,'oNiMK0e1n33lgLzzJYnjP44nsTlg',NULL,NULL,'微信用户','',NULL,'F+uPMy0I+7Ms2uoOiedW0g==',NULL,'2026-02-28 14:30:00','2026-02-28 14:30:00',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(39,'oNiMK0dMIPxXUJiIbjf7FoXKz2ZY',NULL,NULL,'微信用户','',NULL,'p+srs8YFr9kCJhWVh9FQ9A==',NULL,'2026-02-28 19:50:41','2026-02-28 19:50:41',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(40,'oNiMK0Y0kzzgf30NzONYYt5GhxUc',NULL,NULL,'微信用户','',NULL,'EF86tnx28HNWiVnRy9HPwQ==',NULL,'2026-02-28 22:25:31','2026-02-28 22:25:31',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(41,'oNiMK0WnwhpHrAPTGroew2pHAqHI',NULL,NULL,'微信用户','',NULL,'6ICnODEr6ZcLCrZA/S85yg==',NULL,'2026-03-01 05:52:45','2026-03-01 05:52:45',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(42,'oNiMK0Qz6bDUfoT1FBQd1rDA8S7M',NULL,NULL,'微信用户','',NULL,'59gvsx1oO8yPSXSnxMzzFA==',NULL,'2026-03-01 11:36:50','2026-03-01 11:36:50',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(43,'oNiMK0X1VUks873sF7t2SOuRThXU',NULL,NULL,'微信用户','',NULL,'dX18aZwceOBtAYOH4rke7w==',NULL,'2026-03-01 11:36:50','2026-03-01 11:36:50',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(44,'oNiMK0SaahoP1bl-HFiUpyOBaUaE',NULL,NULL,'微信用户','',NULL,'Vqwg1t7e97kdfP/FbTsPWg==',NULL,'2026-03-01 14:18:42','2026-03-01 14:18:42',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(45,'oNiMK0fCDoXnfMmGrUL0MnvZcI-8',NULL,NULL,'微信用户','',NULL,'aAEVe7xThBxB6EASlFN7QA==',NULL,'2026-03-02 01:36:28','2026-03-02 01:36:28',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(46,'oNiMK0fYf3He8p7IezBQUGKIf_k4',NULL,NULL,'微信用户','',NULL,'j2SMYSu8pSxiirGUsjge/w==',NULL,'2026-03-02 12:00:31','2026-03-03 11:15:32',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(47,'oNiMK0VQ47c5mHKda4iQWKJZpkd0',NULL,NULL,'微信用户','',NULL,'Ra5ooOyIzGMBZN1jHy5D0A==',NULL,'2026-03-03 00:00:14','2026-03-03 00:00:14',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(48,'oNiMK0XmisdLL9xmjQGjoGJBtpEg',NULL,NULL,'微信用户','',NULL,'wj9V6pCZdx4geDQeAoaHOQ==',NULL,'2026-03-03 00:19:10','2026-03-03 00:19:10',NULL,NULL,NULL,NULL,NULL,'organic',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verification_codes`
--

DROP TABLE IF EXISTS `verification_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `code` varchar(10) NOT NULL COMMENT '验证码',
  `type` varchar(20) NOT NULL COMMENT '类型：register注册, reset重置密码',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `ip_address` varchar(50) DEFAULT NULL COMMENT '请求IP地址',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_expire` (`expire_time`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='验证码表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification_codes`
--

LOCK TABLES `verification_codes` WRITE;
/*!40000 ALTER TABLE `verification_codes` DISABLE KEYS */;
INSERT INTO `verification_codes` VALUES (5,'13800138002','123388','register','2026-02-07 20:54:58','2026-02-07 12:49:57',NULL),(6,'13900139999','806383','register','2026-02-07 21:22:54','2026-02-07 13:17:54',NULL),(7,'13892824954','639786','register','2026-02-07 22:37:38','2026-02-07 14:32:37',NULL),(8,'13895982933','858450','register','2026-02-07 22:37:57','2026-02-07 14:32:57',NULL),(9,'13881252856','617897','register','2026-02-07 22:39:47','2026-02-07 14:34:46',NULL),(10,'13882820423','771351','register','2026-02-07 22:40:40','2026-02-07 14:35:40',NULL),(18,'17652325623','114298','register','2026-02-09 11:53:26','2026-02-09 03:48:25',NULL),(21,'17652365239','256700','register','2026-02-10 18:36:18','2026-02-10 10:31:17',NULL),(22,'17682536236','459072','register','2026-02-10 20:44:19','2026-02-10 12:39:19',NULL),(28,'13800138000','114764','login','2026-02-17 18:13:50','2026-02-17 10:08:49',NULL);
/*!40000 ALTER TABLE `verification_codes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-03 11:36:54
