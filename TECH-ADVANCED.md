# Tech-advance
 1. Apache kafka
```xml
<spring-cloud.version>2025.1.3</spring-cloud.version>
```

```xml
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-kafka</artifactId>
</dependency>
```

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

 2. Redis

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>	    
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

 3. Mapstruct

```xml
<org.mapstruct.version>1.6.3</org.mapstruct.version>
```

```xml
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>${org.mapstruct.version}</version>
</dependency>
```

```xml
<path>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>${org.mapstruct.version}</version>
</path>
```
