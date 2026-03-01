FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 10000

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["HotelSystem.API/HotelSystem.API.csproj", "HotelSystem.API/"]
COPY ["HotelSystem.Application/HotelSystem.Application.csproj", "HotelSystem.Application/"]
COPY ["HotelSystem.Domain/HotelSystem.Domain.csproj", "HotelSystem.Domain/"]
COPY ["HotelSystem.Infrastructure/HotelSystem.Infrastructure.csproj", "HotelSystem.Infrastructure/"]
RUN dotnet restore "HotelSystem.API/HotelSystem.API.csproj"
COPY . .
WORKDIR "/src/HotelSystem.API"
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HotelSystem.API.dll"]
