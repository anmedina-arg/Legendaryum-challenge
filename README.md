# Legendaryum-challenge
Contexto: La funcionalidad radica en que en el metaverso aparezcan coleccionables representados en forma de una moneda en 3D, la persona se acerca y obtiene la moneda y su recompensa.
El tema está en que una vez que una persona agarra la moneda, ya desaparece y nadie más la puede obtener, por lo menos la moneda que estaba en esa posición.

Challenge: Crear un microservicio en donde un cliente se pueda conectar por socket (Socket.io).
Una vez conectado, le tiene que indicar al microservicio en que espacio del metaverso está (room) entonces el microservicio le devuelve todas las monedas de esa room junto a su posición (x, y, z).

El cliente puede mandar una señal al micro indicando que agarró una moneda, para que el micro la borre de las monedas disponibles.

El micro debe mandar una señal a todos los clientes, indicando qué monedas dejan de estar disponibles (cuando alguien más la agarra).

También se deberá montar una api rest para consultar varias o básicas, ej.: cantidad de monedas disponibles en una room

La forma de configurar el microservicio, es mediante un JSON. Donde le vamos a indicar las rooms, la cantidad de monedas a generar, y un area 3D(xmax, xmin, ymax...), donde se van a generar las monedas.

La persistencia debe ser en redis, para guardar las posiciones de las monedas generadas.

Otra característica, es que las monedas generadas tengan ttl, osea que cada 1 hora se generen otro set de monedas, y las de la hora anterior, se borren.

Tecnologias: Express, NodeJs, Typescript, Redis, Socket.io, Docker

En lo posible que esté todo tipado, intentar no utilizar "any"
