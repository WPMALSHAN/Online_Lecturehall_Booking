package .config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DatabaseCheck {

    @Bean
    public CommandLineRunner checkConnection(DataSource dataSource) {
        return args -> {
            try {
                dataSource.getConnection().close();
                System.out.println("🔥 DATABASE CONNECTED SUCCESSFULLY 🔥");
            } catch (Exception e) {
                System.out.println("❌ DATABASE CONNECTION FAILED ❌");
            }
        };
    }
}