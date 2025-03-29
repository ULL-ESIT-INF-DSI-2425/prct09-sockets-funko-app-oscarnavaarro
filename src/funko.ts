/**
 * Enum para representar los diferentes tipos de Funkos.
 */
export enum FunkoType {
  Pop = "Pop!",
  PopRides = "Pop! Rides",
  VynilSoda = "Vynil Soda",
  VynilGold = "Vynil Gold",
}

/**
 * Enum para representar los diferentes géneros de Funkos.
 */
export enum FunkoGenre {
  Animation = "Animación",
  MoviesTV = "Películas y TV",
  VideoGames = "Videojuegos",
  Sports = "Deportes",
  Music = "Música",
  Anime = "Anime",
}

/**
 * Clase que representa un Funko Pop.
 */
export class Funko {
  /**
   * Crea una nueva instancia de un Funko.
   * 
   * @param id - Identificador único del Funko.
   * @param name - Nombre del Funko.
   * @param description - Descripción del Funko.
   * @param type - Tipo del Funko (ver {@link FunkoType}).
   * @param genre - Género del Funko (ver {@link FunkoGenre}).
   * @param franchise - Franquicia a la que pertenece el Funko.
   * @param number - Número del Funko dentro de la franquicia.
   * @param exclusive - Indica si el Funko es exclusivo.
   * @param specialFeatures - Características especiales del Funko.
   * @param marketValue - Valor de mercado del Funko.
   */
  constructor(
    public id: number,
    public name: string,
    public description: string,
    public type: FunkoType,
    public genre: FunkoGenre,
    public franchise: string,
    public number: number,
    public exclusive: boolean,
    public specialFeatures: string,
    public marketValue: number,
  ) {}
}