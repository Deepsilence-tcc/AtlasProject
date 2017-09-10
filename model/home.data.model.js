class HomeData{

    constructor(rows){
        this.data = rows;
    };
    generateStruct(){
        var result = {};
        var datas = [];
        this.data.forEach(function (item) {
            if(item.id1!=null){
                result.model={
                    id:item.id1,
                    name:item.name,
                    portrait:item.portrait,
                    is_fav:item.mode_fav,
                }
            }else {
                result.model=null
            }
            result.id = item.id;
            result.title = item.title;
            result.date = item.date;
            result.buy_count = item.buy_count;
            result.is_fav = item.is_fav;
            if(item.pic!=null){
                result.pic = item.pic;
            }
            datas.push(result);

        })
        return datas;
    }


}