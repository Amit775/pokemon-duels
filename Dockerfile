# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the main project file and restore dependencies
COPY apps/server/Server.csproj apps/server/
RUN dotnet restore apps/server/Server.csproj

# Copy the rest of the source code
COPY apps/server/ apps/server/
COPY board.json .

# Build and publish
WORKDIR /src/apps/server
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .
COPY --from=build /src/board.json .

# Cloud Run uses PORT environment variable
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "Server.dll"]
