
function listaEstacoes() {
    var arrEstacao = [];

    $.ajax({
        type: "GET",
        url: baseURL + "/Estacao/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            $("#loader").hide();
            var e = response;
            
            e.forEach(estacao => {
                var est = {
                    id: estacao.est_id,
                    latitude: estacao.est_latitude,
                    longitude: estacao.est_longitude,
                    nome: estacao.est_nome
                }
                arrEstacao.push(est);
            });
            
        },
        failure: function (response) {
            console.log('falhou');
        },
        error: function (response) {
            console.log('errou');
        }
    });


    return arrEstacao;


    //registra as localizações das estações
    var modeloEstacao = [
        {
            position: new google.maps.LatLng(-23.1999782, -45.8907102),
            type: 'parking',
            latlng: "-23.1999782, -45.8907102"
        }, {
            position: new google.maps.LatLng(-23.1954351, -45.900689),
            type: 'parking',
            latlng: "-23.1954351, -45.900689"
        }
    ];
        

}

