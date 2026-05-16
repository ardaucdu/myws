# {{7*7}} → 49: SSTI Zafiyetini Anlamak
## SSTI ve CSTI
Günümüzde çoğu web sitesi dinamik web sayfaları kullanmaktadır. Dinamik sayfalar, içeriği kullanıcıya göre server tarafında (server-side) veya istemcide (client-side) oluşturur. Bu oluşturma işlemi sırasında devreye **template engine** girer. Server-side saldırılar bir sunucu tarafından sağlanan uygulama veya hizmeti hedef alırken, Client-side saldırıları sunucunun kendisinde değil, istemcinin makinesinde gerçekleşir. İçeriğin nerede ve hangi tarafta oluşturulduğu, SSTI ile CSTI zafiyetleri arasındaki temel farkı ortaya koyar.

SSTI zafiyetlerinde içerik yukarıda da bahsedildiği gibi sunucu tarafında çalışan bir template engine ile rendering edilir ve çıktı HTML şeklinde client’a gönderilir. **Eğer inputlar yeterince filtrelenmeden doğrudan template engine’e aktarılırsa, bu ifadeler template engine tarafından değişken değil template ifadeleri (template expressions) veya fonksiyon çağrıları olarak yorumlanabilir.** Genelde karşımıza çıkan `{{7*7}}` ifadesi, bize template engine’in input’u olması gerektiği gibi değişken olarak mı algıladığını yoksa injection’a izin verip vermediğini gösterir. Zamanla bu payload, SSTI konusunda kültleşmiş bir test ifadesi haline gelmiştir.

CSTI’da ise template işleme işlemi, kullanıcının tarayıcısı üzerinde gerçekleştirilir. Günümüzde kullanılan birçok frontend framework’ü, istemci tarafında da template rendering işlemi yapabilmektedir. Bu nedenle, template ifadelerini içeren kullanıcı girdileri aracılığıyla CSTI zafiyetleri ortaya çıkabilir.

## Örnek: Jinja2 Güvenli Kod

![SSTI2](images/20260516035644.png)
`render()` fonksiyonuna gönderilen template `"Hello {{name}}"` statik bir değerdir, input “Arda” sadece “name” adlı değişkenin değeri olarak atanıyor. Bunlar bu kodun Template Injection konusunda güvenli olmasının ana sebepleridir.  
Çıktı: **Hello Arda  
**Burada `{{7*7}}` ifadesi çalışmayacaktır.

## Zafiyetli Kod Örneği
![SSTI2](images/20260516035728.png)
Bu koddaki tehlikeli kısım, `render()`’ın alacağı template sadece `{{7*7}}` değil `"Hello {{7*7}}"` şeklinde olduğunda, çıktı olarak **Hello 49** döndürmesidir. İşte bu durum SSTI açığına neden olur.

## SSTI Saldırı Metodolojisi

Hedef sistemde bu açığın varlığı hata kodlarından veya gönderdiğimiz input’un render edilip edilmediğini yorumladığımızda ortaya çıkar. Farklı template engine’ler biraz farklı syntax’lar kullanabilir.

## SSTI Tespiti

SSTI’yi tespit etme süreci, diğer injection’ları tespit etme süreçlerine benzer. Karşı tarafta bir hata mesajı oluşturtmak veya hangi özel karakteri render ettiğini görmek için:

> ${{<%[%’”}}%\.

payload’ını input olarak veririz. Bu, SQL injection tespitlerinde `'` (tek tırnak) inputu vererek SQL sorgusunun sözdizimini bozmasına ve hatayla karşılaşılmasına benzer.  
Sonrasında ya hata bekleriz ya da belirli bir kısmına bir belirteç koyabiliriz:

> ${{<%[arda%’”}}%\.

Böylece çıktıda hangi özel karakterlerin işlendiğini görürüz ve hangi template engine kullanıldığını anlamaya çalışırız.

![SSTI3](images/20260516035743.png)

> örnek olarak verdiğimiz input ve çıktı karşılaştırıldığında **<%** özel karakterlerinin eksik olduğunu görüyoruz.

## Saldırı Senaryosu 1

Bu davranışı internette araştırdığımızda (book.hacktricks.wiki’de önerildiği gibi) ERB (Ruby), Mako (Python) gibi sık kullanılan template engine’lerle alakalı olduğunu görüyoruz

> **ERB ile passwd dosyasını okumak:  
> <%= system(‘cat /etc/passwd’) %>**


![SSTI4](images/20260516035755.png)

Bu sistemde başarılı oluyoruz.

Eğer başarılı olamasaydık diğer ihtimaldeki (<% kullanan) template engine’leri denerdik veya bu sistemdeki ERB template kullanıldığından eminsek ve zafiyet olduğunu düşünüyorsak sistemde komut çalıştırma fonksiyonlarına erişimin engellendiğini düşünürüz. Fakat Ruby ve diğer OOP diller sayesinde, farklı yollar denememiz mümkün. Çünkü OOP de her şey nesnedir. Yani düşünce biçimimiz her nesne bir class’a sahip, o class üzerinden gelen methodlara erişebiliriz ve bazı methodlar ile başka class ve methodlara ulaşabiliriz.

Yani şu şekilde düşünebiliriz:
**Object → Class → Method → Execute**

## Saldırı Senaryosu 2

Sistemde Template Injection olduğunu anladıktan sonra:  
İlk olarak

> <%=“arda”.class%>

yazıp çıktısını görürüz.Bize bulunduğumuz sınıfı söyler. Aynı zamanda Ruby’de her sınıf başka bir sınıftan türetildiğini bildiğimizden zincirin ilk aşamasıdır. Bundan sonra bir üst sınıfa çıkacağız.
![SSTI](images/20260516035821.png)
Diğer aşamada superclass’a çıkacağız

> <%= “arda”.class.superclass %>

yazdığımızda Object çıktısını alıyoruz. Object sınıfı Ruby’deki en temel sınıftır ve içinde bir çok işimize yarayabilecek method vardır.
![SSSTI](images/20260516035832.png)
Method aşamasında

> <%= Object.methods %>

inputunu methodları görmek için kullanırız. Burada uzunca bir method çıktısı alıyoruz.

![SSTI](images20260516035845.png/)

Özellikle yukarıda altını çizdiğim aşağıdaki methodlar RCE yapmak için güçlü methodlardır.

- `:__send__`
- `:send`
- `:instance_eval`
- `:instance_exec`

Yukarıdan topladığımız bilgilerle:

> <%= Object.const_get(“File”).read(“/etc/passwd”) %>

Bu payload ile`/etc/passwd` dosyası okunabilir.

![SSTI8](images/20260516035859.png)

Eğer passwd dosyasını direkt

> <%=system(‘cat /etc/passwd’)%>

şeklinde okuyamasaydık ==senaryosu== üzerine gittik ve en son kullandığımız payload ile okuduk.

## Sonuç

SSTI, küçük bir input kontrol zafiyetinden **RCE**’ye kadar gidebilen ciddi bir güvenlik açığıdır.

Farklı template engine’lerde farklı syntax’lar bulunsa da genel hatlarıyla metodoloji genellikle aynıdır.Metodolojinin en basite indirgenmiş hali:

1. Test → **${{<%[%’”}}%\.**
2. Template türünü belirle → ERB (Ruby)
3. Exploit et → <%=system(‘cat /etc/passwd’)%>
