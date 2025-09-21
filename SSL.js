// Frida SSL证书固定绕过脚本
// 在手机上运行此脚本来禁用SSL验证

Java.perform(function() {
    console.log("🔓 开始禁用SSL证书验证...");
    
    // 禁用TrustManager验证
    var TrustManager = Java.use("javax.net.ssl.X509TrustManager");
    TrustManager.checkServerTrusted.implementation = function(chain, authType) {
        console.log("✅ 绕过TrustManager验证");
    };
    
    TrustManager.checkClientTrusted.implementation = function(chain, authType) {
        console.log("✅ 绕过Client TrustManager验证");
    };
    
    TrustManager.getAcceptedIssuers.implementation = function() {
        return [];
    };
    
    // 禁用HostnameVerifier
    var HostnameVerifier = Java.use("javax.net.ssl.HostnameVerifier");
    HostnameVerifier.verify.implementation = function(hostname, session) {
        console.log("✅ 绕过Hostname验证: " + hostname);
        return true;
    };
    
    // 处理OkHttp的证书固定
    var CertificatePinner = Java.use("okhttp3.CertificatePinner");
    CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(hostname, peerCertificates) {
        console.log("✅ 绕过OkHttp CertificatePinner: " + hostname);
    };
    
    // 处理Android的证书固定
    var NetworkSecurityPolicy = Java.use("android.security.net.config.NetworkSecurityPolicy");
    NetworkSecurityPolicy.isCertificateTransparencyVerificationRequired.overload('java.lang.String').implementation = function(hostname) {
        return false;
    };
    
    // 处理Apache HttpClient
    try {
        var SSLContext = Java.use("javax.net.ssl.SSLContext");
        SSLContext.init.overload('[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom').implementation = function(keyManagers, trustManagers, secureRandom) {
            console.log("✅ 绕过SSLContext初始化");
            this.init(keyManagers, null, secureRandom);
        };
    } catch(e) {
        console.log("⚠️ SSLContext绕过失败: " + e.message);
    }
    
    console.log("🎉 SSL证书固定已成功禁用");
});

// 额外的网络监控功能
function monitorNetwork() {
    Java.perform(function() {
        // 监控URLConnection
        var URLConnection = Java.use("java.net.URLConnection");
        URLConnection.connect.implementation = function() {
            console.log("🌐 URLConnection连接到: " + this.getURL().toString());
            return this.connect();
        };
        
        // 监控HttpURLConnection
        var HttpURLConnection = Java.use("java.net.HttpURLConnection");
        HttpURLConnection.getInputStream.implementation = function() {
            console.log("📥 获取输入流: " + this.getURL().toString());
            return this.getInputStream();
        };
        
        // 监控OkHttp请求
        try {
            var OkHttpClient = Java.use("okhttp3.OkHttpClient");
            var RealCall = Java.use("okhttp3.RealCall");
            RealCall.execute.implementation = function() {
                var request = this.request();
                console.log("🚀 OkHttp请求: " + request.method() + " " + request.url().toString());
                return this.execute();
            };
        } catch(e) {
            console.log("⚠️ OkHttp监控不可用");
        }
    });
}

// 执行监控
setTimeout(monitorNetwork, 1000);
