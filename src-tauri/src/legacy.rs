use serde::Serialize;
use std::{
    fs, io,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
pub struct LegacySave {
    progress: Option<String>,
    options: Option<String>,
}

fn read_if_present(path: PathBuf) -> io::Result<Option<String>> {
    match fs::read_to_string(path) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

fn read_files(directory: &Path) -> io::Result<LegacySave> {
    Ok(LegacySave {
        progress: read_if_present(directory.join("savegame.save"))?,
        options: read_if_present(directory.join("optigame.save"))?,
    })
}

fn legacy_dir(app: &AppHandle) -> tauri::Result<PathBuf> {
    #[cfg(target_os = "android")]
    let directory = app.path().app_data_dir()?.join("files");

    #[cfg(not(any(target_os = "android", target_os = "windows")))]
    let directory = app
        .path()
        .data_dir()?
        .join("godot")
        .join("app_userdata")
        .join("quantumQ");

    #[cfg(target_os = "windows")]
    let directory = app
        .path()
        .data_dir()?
        .join("Godot")
        .join("app_userdata")
        .join("quantumQ");

    Ok(directory)
}

#[tauri::command]
pub fn read_legacy_save(app: AppHandle) -> Result<LegacySave, String> {
    let directory = legacy_dir(&app).map_err(|error| error.to_string())?;
    read_files(&directory).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_godot_save_files_without_modifying_them() {
        let directory = std::env::temp_dir().join(format!("quantumq-saves-{}", std::process::id()));
        fs::create_dir_all(&directory).unwrap();

        let empty = read_files(&directory).unwrap();
        assert!(empty.progress.is_none());
        assert!(empty.options.is_none());

        fs::write(directory.join("savegame.save"), "{\"0\":true,\"1\":true}\n").unwrap();
        fs::write(directory.join("optigame.save"), "true\n").unwrap();

        let save = read_files(&directory).unwrap();
        assert_eq!(save.progress.as_deref(), Some("{\"0\":true,\"1\":true}\n"));
        assert_eq!(save.options.as_deref(), Some("true\n"));
        assert!(directory.join("savegame.save").exists());
        assert!(directory.join("optigame.save").exists());
        fs::remove_dir_all(directory).unwrap();
    }
}
