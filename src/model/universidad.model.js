/**
 * @module UniversidadModel
 */
const { object, number } = require('joi');
const pool = require('./connectDatabase');

const Universidad = function () {

}

/**
 * Obtiene la lista de universidades con sus datos mas relevantes.
 * @function  getAll
 * @param {callback} result Maneja el error y la respuesta, si esta es exitosa.
 * @returns {Object} Lista de datos de las universidades.
 */
Universidad.getAll = (result) => {
    let query = `
    SELECT 
        universidad.ID AS Universidad_ID, 
        universidad.Nombre, 
        universidad.Ruta_Escudo, 
        IF(universidad.Tipo=0,'Publica','Privada') AS Tipo, 
        COUNT(IF(nivel_educativo.Nombre='LICENCIATURA',1, NULL)) AS LICENCIATURA, 
        COUNT(IF(nivel_educativo.Nombre='MAESTR&IACUTE;A',1, NULL)) AS MAESTRIA, 
        COUNT(IF(nivel_educativo.Nombre='DOCTORADO',1, NULL)) AS DOCTORADO, 
        IF(COUNT(beca.Titulo) > 0, 1, 0) AS BECA, 
        GROUP_CONCAT(DISTINCT carrera.Nombre) Carreras,
        GROUP_CONCAT(DISTINCT carrera.Recurso) RecursoCarreras 
    FROM 
        universidad 
    INNER JOIN 
        carrera ON 
        universidad.ID = carrera.Universidad_ID 
    INNER JOIN 
        nivel_educativo ON 
        carrera.Nivel_Educativo_ID = nivel_educativo.ID 
    LEFT JOIN beca ON 
        universidad.ID = beca.Universidad_ID 
    GROUP BY universidad.ID 
    ORDER BY universidad.ID 
    ASC`;

    let areas;
    let queryGetArea = `
    SELECT
        carrera.Universidad_ID,
        GROUP_CONCAT(DISTINCT carrera_clasificacion.area1) AS area
    FROM 
        carrera
    INNER JOIN carrera_clasificacion
    ON 
        carrera.Nombre = carrera_clasificacion.nombre_carrera
    GROUP BY carrera.Universidad_ID
    ORDER BY carrera.Universidad_ID
    `;

    pool.query(queryGetArea, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los datos de la universidad" }, null);
            return;
        }

        areas = res;

        pool.query(query, (err, res) => {
            if (err) {
                console.log("error: ", err);
                result({ message: "Ocurrio un error al obtener los datos de la universidad" }, null);
                return;
            }

            if (Object.entries(res).length === 0) {
                result(null, { message: "No existen universidades" });
                return;
            }

            const dataUniversidades = res.map(dataUni => {
                return {
                    ...dataUni,
                    area: "NA",
                    Carreras: dataUni.Carreras.split(','),
                    //RecursoCarreras: dataUni.RecursoCarreras.split(',')
                }
            });

            for (let i = 0; i < dataUniversidades.length; i++) {
                dataUniversidades[i].LICENCIATURA = dataUniversidades[i].Carreras.length;
                for (let j = 0; j < areas.length; j++) {
                    if (dataUniversidades[i].Universidad_ID === areas[j].Universidad_ID) {
                        dataUniversidades[i].area = areas[j].area;
                    }
                }
                delete dataUniversidades[i].Carreras;
                delete dataUniversidades[i].RecursoCarreras;
            }

            result(null, dataUniversidades);
        });
    });
};

/**
 * Retorna una lista de universidades que sean el mismo tipo de universidad, ya sea publica o privada.
 * @function getType
 * @param {Number} tipoUniversidad 0 para publica y 1 para privada.
 * @param {function} result Maneja los errores y responde, si todo va bien.
 * @returns {Object} Lista de universidades.
 */
Universidad.getType = (tipoUniversidad, result) => {
    let query = `SELECT universidad.ID AS Universidad_ID, universidad.Nombre, universidad.Ruta_Escudo, IF(universidad.Tipo=0,'Publica','Privada') AS Tipo, COUNT(IF(nivel_educativo.Nombre='LICENCIATURA',1, NULL)) AS LICENCIATURA, COUNT(IF(nivel_educativo.Nombre='MAESTR&IACUTE;A',1, NULL)) AS MAESTRIA, COUNT(IF(nivel_educativo.Nombre='DOCTORADO',1, NULL)) AS DOCTORADO,IF(COUNT(beca.Titulo) > 0, 1, 0) AS BECA,GROUP_CONCAT(DISTINCT carrera.Nombre) Carreras FROM universidad INNER JOIN carrera ON universidad.ID = carrera.Universidad_ID INNER JOIN nivel_educativo ON carrera.Nivel_Educativo_ID = nivel_educativo.ID LEFT JOIN beca ON universidad.ID = beca.Universidad_ID WHERE universidad.Tipo=${tipoUniversidad} GROUP BY universidad.ID ORDER BY universidad.ID ASC`;

    /**
     * Obtiene la lista de universidades con sus datos mas relevantes, tomando en cuenta el tipo de universidad.
     * @function queryGetType
     * @param {string} query Consulta a la base de datos los datos mas relevandes de las universidades toamando en cuenta el tipo de universidad.
     * @param {callback} result Maneja el error y la respuesta, si esta es exitosa.
     * @returns {Object} Lista de datos de las universidades.
     */
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los datos de la universidad" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        result(null, res);
    })
}

/**
 * Se encarga de consultar los datos de una universidad especifica y responder tales datos.
 * @function getById
 * @param {string} id Id de la universidad, la cual se quiera obtener sus datos.
 * @param {callback} result Maneja los errores y responde, si todo va bien.
 */
Universidad.getById = (id, result) => {
    const urlYoutube = "https://www.youtube.com/watch?v=";

    let query = `
    SELECT
        universidad.ID AS Universidad_ID,
        universidad.Nombre, 
        universidad.Ruta_Escudo,
        contacto_universidad.Telefono,
        universidad.Proceso_Admision,
        contacto_universidad.Correo_Electronico,
        IF(universidad.Tipo=0,'Publica','Privada') AS Tipo,
        GROUP_CONCAT(DISTINCT carrera.Nombre) Carreras,
        GROUP_CONCAT(DISTINCT carrera.Recurso) RecursoCarreras,
        GROUP_CONCAT(DISTINCT video.Seccion_ID) VideoSeccion_ID,
        GROUP_CONCAT(DISTINCT video.Titulo) Videos,
        GROUP_CONCAT(DISTINCT video.Recurso) RecursoVideos,
        GROUP_CONCAT(DISTINCT foto.Seccion_ID) FotoSeccion_ID,
        GROUP_CONCAT(DISTINCT foto.Titulo) Fotos,
        GROUP_CONCAT(DISTINCT foto.Recurso) RecursoFotos,
        GROUP_CONCAT(DISTINCT beca.Titulo) Becas,
        GROUP_CONCAT(DISTINCT beca.Recurso) RecursoBecas,
        ubicacion.url_Maps,
        CONCAT(Num_Interior, " ", Num_Exterior, " ", Calle, " ", Colonia, " ", Ciudad, " ", municipio.Nombre, " ", Codigo_Postal) AS Direccion
    FROM universidad
    INNER JOIN video
    ON 
        universidad.ID = video.Universidad_ID
    INNER JOIN carrera 
    ON 
        universidad.ID = carrera.Universidad_ID 
    INNER JOIN nivel_educativo 
    ON 
        carrera.Nivel_Educativo_ID = nivel_educativo.ID
    INNER JOIN foto
    ON
        universidad.ID = foto.Universidad_ID
    INNER JOIN ubicacion
    ON 
        universidad.id = ubicacion.Universidad_ID
    INNER JOIN municipio
    ON 
        ubicacion.Municipio_ID = municipio.ID
    INNER JOIN contacto_universidad
    ON
        universidad.ID = contacto_universidad.Universidad_ID
    LEFT JOIN beca
    ON
        universidad.ID = beca.Universidad_ID
    WHERE
        universidad.ID = ${id}`;

    let queryRedesSociales = `
    SELECT
        Nombre AS Red_social,
        Recurso
    FROM universidad_red_social
    INNER JOIN red_social
    ON
        universidad_red_social.Red_Social_ID = red_social.ID
    WHERE
        universidad_red_social.Universidad_ID = ${id}`;


    /***
     * Se encarga de obtener las redes sociales de una universidad.
     * @function queryGetRedesSociales 
     * @param {string} queryRedesSociales Consulta para obtener las redes sociales de una universidad.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Lista de redes sociales de la universidad.
     */

    let RedesSociales;
    pool.query(queryRedesSociales, (err, res) => {
        if (err) {
            console.log("error: ", err);
            RedesSociales = null;
            return;
        }

        RedesSociales = res;

        /**
         * Validar si el objeto esta vacio.
         * @function isEmptyRes
         * @param {Object} obj Objeto a validar.
         * @returns {Object} Asigna el valor NA a los campos vacios.
         */
        if(Object.entries(RedesSociales).length === 0) {
            RedesSociales = {
                Red_social: "NA",
                Recurso: "NA"
            };
        }
    });

    /**
     * Se encarga de obterner todos los datos de la universidad, nombre, escudo, tipo, carreras, videos, fotos, direccion, telefono, correo electronico, redes sociales, maps, etc.
     * @function queryGetUniversidades
     * @param {string} query Consulta para obtener los datos de la universidad.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Datos de la universidad.
     */
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los datos de la universidad" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        /**
         * Separar las carreras y sus recursos de cada universidad por comas, y agregar el link de youtube.
         * @function modifyDataUni
         * @param {Object} dataUniversidades Datos de las universidades.
         * @returns {Object} Datos de las universidades con sus carreras y recursos separados, Seccion_ID se devuelve como entero.
         */

        const data = res.map(dataUni => {
            dataUni.Telefono !== null ? 1 : dataUni.Telefono = "NA";
            dataUni.Proceso_Admision !== null ? 1 : dataUni.Proceso_Admision = "NA";
            dataUni.Correo_Electronico !== null ? 1 : dataUni.Correo_Electronico = "NA";
            dataUni.Direccion !== null ? 1 : dataUni.Direccion = "NA";
            
            return {
                ...dataUni,
                Carreras: dataUni.Carreras !== null ? dataUni.Carreras.split(',') : ["NA"],
                RecursoCarreras: dataUni.RecursoCarreras !== null ? dataUni.RecursoCarreras.split(',') : ["NA"],
                VideoSeccion_ID: dataUni.VideoSeccion_ID !== null ? dataUni.VideoSeccion_ID.split(',').map(id => Number(id)) : ["NA"],
                TituloVideo: dataUni.Videos !== null ? dataUni.Videos.split(',') : ["NA"],
                RecursoVideo: dataUni.RecursoVideos !== null ? dataUni.RecursoVideos.split(',') : ["NA"],
                FotoSeccion_ID: dataUni.FotoSeccion_ID !== null ? dataUni.FotoSeccion_ID.split(',').map(id => Number(id)) : ["NA"],
                TituloFoto: dataUni.Fotos !== null ? dataUni.Fotos.split(',') : ["NA"],
                RecursoFoto: dataUni.RecursoFotos !== null ? dataUni.RecursoFotos.split(',') : ["NA"],
                Becas: dataUni.Becas !== null ? dataUni.Becas.split(',') : ["NA"],
                RecursoBecas: dataUni.RecursoBecas !== null ? dataUni.RecursoBecas.split(',') : ["NA"],
                url_Maps: dataUni.url_Maps !== null ? dataUni.url_Maps.substring(13, dataUni.url_Maps.length - 88) : "NA"
            }
        });

        /**
         * Genera un json con los titulos y recurso de las carreras, fotos y videos de la universidad. 
         * @function generateJSON_Carreras
         * @param {Object} dataUni Datos de la universidad.
         * @returns {Object} Datos de la universidad y sus recursos. 
         */
        const dataUniversidad = data.map(dataUni => {
            return {
                ...dataUni,
                redesSociales: RedesSociales,
                /**
                 * Genera un json con los titulos y recursos.
                 * @function generateJSON_Carreras 
                 * @param {Object} dataUni Datos de la universidad.
                 * @returns {Object} Datos de la universidad y sus recursos.
                 */
                Carreras: dataUni.Carreras.map(carrera => {
                    dataUni.RecursoCarreras[dataUni.Carreras.indexOf(carrera)] !== undefined ? 1 : dataUni.RecursoCarreras[dataUni.Carreras.indexOf(carrera)] = "NA";
                    return {
                        Nombre: carrera,
                        Recurso: dataUni.RecursoCarreras[dataUni.Carreras.indexOf(carrera)]
                    }
                }),
                Videos: dataUni.TituloVideo.map(video => {
                    return {
                        Seccion_ID: dataUni.VideoSeccion_ID[dataUni.TituloVideo.indexOf(video)] > 0 ? dataUni.VideoSeccion_ID[dataUni.TituloVideo.indexOf(video)] : 0,
                        Titulo: video,
                        Recurso: dataUni.RecursoVideo[dataUni.TituloVideo.indexOf(video)] === "NA" ? "NA" : urlYoutube + dataUni.RecursoVideo[dataUni.TituloVideo.indexOf(video)]
                    }
                }),
                Fotos: dataUni.TituloFoto.map(foto => {
                    dataUni.RecursoFoto[dataUni.TituloFoto.indexOf(foto)] !== undefined ? 1 : dataUni.RecursoFoto[dataUni.TituloFoto.indexOf(foto)] = "NA";
                    return {
                        Seccion_ID: dataUni.FotoSeccion_ID[dataUni.TituloFoto.indexOf(foto)] > 0 ? dataUni.FotoSeccion_ID[dataUni.TituloFoto.indexOf(foto)] : 0,
                        Titulo: foto,
                        Recurso: dataUni.RecursoFoto[dataUni.TituloFoto.indexOf(foto)]
                    }
                }),
                Becas: dataUni.Becas.map(beca => {
                    dataUni.RecursoBecas[dataUni.Becas.indexOf(beca)] !== undefined ? 1 : dataUni.RecursoBecas[dataUni.Becas.indexOf(beca)] = "NA";
                    return {
                        Nombre: beca,
                        Recurso: dataUni.RecursoBecas[dataUni.Becas.indexOf(beca)]
                    }
                })
            }
        });

        //Elimina los datos de la universidad que no se necesitan
        delete dataUniversidad[0].RecursoCarreras;
        delete dataUniversidad[0].RecursoVideos;
        delete dataUniversidad[0].RecursoFotos;
        delete dataUniversidad[0].RecursoFoto;
        delete dataUniversidad[0].RecursoVideo;
        delete dataUniversidad[0].TituloFoto;
        delete dataUniversidad[0].TituloVideo;
        delete dataUniversidad[0].VideoSeccion_ID;
        delete dataUniversidad[0].FotoSeccion_ID;
        delete dataUniversidad[0].RecursoBecas;

        result(null, dataUniversidad[0]);
    });
};

/**
 * Retorna una lista de universidades las cuales tengan una o mas carreras con respecto al area.
 * @function getByArea
 * @param {string} id Id del area.
 * @param {callback} result Maneja los errores y responde, si todo va bien.
 */
Universidad.getByArea = (id, result) => {
    let query = `SELECT DISTINCT universidad.ID AS Universidad_ID, universidad.Nombre AS Nombre, universidad.Ruta_Escudo, IF(universidad.Tipo=0,'Publica','Privada') AS Tipo, carrera.Nombre AS carrera FROM carrera INNER JOIN carrera_area ON carrera_area.Carrera_ID=carrera.ID INNER JOIN universidad ON carrera.Universidad_ID=universidad.ID WHERE carrera_area.Area_ID =${id}`;

    /**
     * Obtiene los datos de las universidades que tengan una o mas carreras con respecto al area.
     * @function queryGetByArea
     * @param {string} query Consulta para obtener los datos de las universidades.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Datos de las universidades.
     */
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los datos de las universidades" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el area en la base de datos" }, null);
            return;
        }

        result(null, res);
    });
};

/**
 * @function getOfertaEducativa Se encarga de consultar a la base de datos, la oferta educativa de la universidad.
 * @param {string} id Id de la universidad la cual se requiera su oferta educatica.
 * @param {callback} result Maneja los errores posibles y responde los datos solicitados.
 */
Universidad.getOfertaEducativa = (id, result) => {
    let query = `SELECT carrera.Universidad_ID, carrera.ID, carrera.Nombre, carrera.Recurso FROM carrera WHERE carrera.Universidad_ID = ${id}`;

    /**
     * Obtiene la oferta educativa de la universidad.
     * @function queryGetOfertaEducativa
     * @param {string} query Consulta para obtener la oferta educativa de la universidad.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Datos de la oferta educativa de la universidad.
     * @returns {Object} Mensaje de error si no existe la universidad.
    */
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, { message: "Ocurrio un error al obtener la oferta educativa de la universidad" });
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        result(null, res);
    });
}

/**
 * Obtiene llos recursos multimedia Fotos y videos de la universidad requerida.
 * @function getMultimedia
 * @param {string} id Id de la universidad.
 * @param {callback} result  Responde los errores, si los hay y la respuesta.
 */
Universidad.getMultimedia = (id, result) => {

    getFotos(id, (err, linksFotos) => {
        if (err) {
            //console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los links de las fotos" }, null);
            return;
        }
        getVideos(id, (err, linksVideos) => {
            if (err) {
                console.log("error: ", err);
                result({ message: "Ocurrio un error al obtener los links de las fotos" }, null);
                return;
            }
            const data = {
                linksFotos,
                linksVideos
            }

            result(null, data);
        });
    });

}

/**
 * la función retorna la dirección de la universidad solicitada, en un formato string
 * @function getDireccion 
 * @param {string} id Id de la universidad de la cual se quiere obtener la direción.
 * @param {callback} result Responde si hay un error en la consulta a la base de datos y responde la dirección de la universidad solicitada
 */
Universidad.getDireccion = (id, result) => {
    let query = `SELECT ubicacion.Universidad_ID, ubicacion.Num_Interior, ubicacion.Num_Exterior, ubicacion.Calle, ubicacion.Colonia, estado.Nombre AS estado, municipio.Nombre, ubicacion.Ciudad, ubicacion.Codigo_Postal FROM ubicacion INNER JOIN municipio ON ubicacion.Municipio_ID = municipio.ID INNER JOIN estado ON municipio.Estado_ID = estado.ID WHERE ubicacion.Universidad_ID = ${id}`;

    /**
     * Obtiene la dirección de la universidad.
     * @function queryGetDireccion
     * @param {string} query Consulta para obtener la dirección de la universidad.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Datos de la dirección de la universidad.
     * @returns {Object} Mensaje de error si no existe la universidad.
     */
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, {
                message: "Ocurrio un error al obtener la dirección"
            });
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        const direccion = res[0].Num_Interior + " " + res[0].Num_Exterior + " " + res[0].Calle + " " + res[0].Colonia + " " + res[0].estado + " " + res[0].Nombre + " " + res[0].Ciudad + " " + res[0].Codigo_Postal;

        const Direccion = {
            Universidad_ID: res[0].Universidad_ID,
            direccion
        }

        result(null, Direccion);
    });
}

/**
 * Obtiene la url de google maps guardada en la base de datos.
 * @param {string} id Se utiliza para obtner la url de maps de la universidad solicitada.
 * @param {callback} result Se encarga de manerjar los errores y responder la url de maps de la universidad solicitada.
 */
Universidad.getUbicacion = (id, result) => {
    let query = `SELECT ubicacion.Universidad_ID, ubicacion.url_Maps FROM ubicacion WHERE ubicacion.Universidad_ID = ${id}`;

    /**
     * Obtiene la url de google maps de la universidad.
     * @function queryGetUbicacion
     * @param {string} query Consulta para obtener la url de google maps de la universidad.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Datos de la url de google maps de la universidad.
     * @returns {Object} Mensaje de error si no existe la universidad.
     */
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, {
                message: "Ocurrio un error al obtener la ubicación"
            });
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        const data = res.map(dataUni => {
            return {
                Universidad_ID: dataUni.Universidad_ID,
                url_Maps: dataUni.url_Maps.substring(13, dataUni.url_Maps.length - 88)
            }
        })

        result(null, data[0]);
    })
}

/**
 * Se encarga de obtener los links de las fotos en la base de datos.
 * @function getFotos
 * @param {string} id Necesita el id la funcion para buscan en la base de datos todas las fotos de la universidad requerida.
 * @param {callback} result Se encarga de manejar los errores y responde los links de las fotos.
 */
getFotos = (id, result) => {
    let queryFoto = `SELECT foto.Universidad_ID, foto.Titulo, foto.Recurso FROM foto WHERE foto.Universidad_ID = ${id}`;

    /**
     * Obtiene los links de las fotos de la universidad.
     * @function queryGetFotos
     * @param {string} query Consulta para obtener los links de las fotos de la universidad.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Datos de los links de las fotos de la universidad.
     * @returns {Object} Mensaje de error si no existe la universidad.
     */
    pool.query(queryFoto, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error en la base de datos" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        result(null, res);
    });
}

/**
 * Se encarga de obtener los links de los videos en la base de datos.
 * @function getVideos
 * @param {string} id Necesita el id la funcion para buscan en la base de datos todas los videos de la universidad requerida.
 * @param {callback} result Se encarga de manejar los errores y responde los links de los videos.
 */
getVideos = (id, result) => {
    const urlYoutube = "https://www.youtube.com/watch?v=";

    let queryVideo = `SELECT video.Universidad_ID, video.ID, video.Titulo, video.Recurso FROM video WHERE video.Universidad_ID = ${id}`;

    /**
     * Obtiene los links de los videos de la universidad.
     * @function queryGetVideos
     * @param {string} query Consulta para obtener los links de los videos de la universidad.
     * @param {function} result Maneja los errores y responde, si todo va bien.
     * @returns {Object} Datos de los links de los videos de la universidad.
     * @returns {Object} Mensaje de error si no existe la universidad.
     */
    pool.query(queryVideo, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error en la base de datos" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        const data = res.map(dataUni => {
            return {
                ...dataUni,
                Recurso: urlYoutube + dataUni.Recurso
            }
        });

        result(null, data);
    });
}

module.exports = Universidad;